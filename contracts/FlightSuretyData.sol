// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "../node_modules/@openzeppelin/contracts/math/SafeMath.sol";
import "./Utils.sol";

contract FlightSuretyData is Utils {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    address private authorizedContract;

    uint private MINIMAL_FUND = 10;

    // Blocks all state changes throughout the contract if false


    uint numberOfApproved;

    struct Airline {
        string name;
        // 0 : does not exist
        // 1 waiting for approval
        // 2 approved
        // 3 funded (10 ether payed)
        // 9 blocked
        uint status;
    }

    //
    // Multiparty Consensus Approval VotingBox
    //

    struct Ballot {
        address voterAddress;
        string name;
        // 0 not voted
        // 1 approve
        // 2 disapprove
        uint vote;
    }

    struct VotingBox {
        mapping(uint => Ballot) ballotList;
        uint size;
    }

    uint private consensusThreshold = 3;
    mapping(uint => address) private airlineList;
    uint private airlineIndex = 0;
    mapping(address => Airline) private airlineData;
    mapping(address => VotingBox) private votingBoxMap;




    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event Registered(address airlineAddress, string airlineName, uint status);

    event VotingEvent(address airlineAddress, string airlineName, uint status);

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
    (
    )
    public
    {
        contractOwner = msg.sender;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/



    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner || msg.sender == authorizedContract, "CALLER_IS_NOT_CONTRACT_OWNER");
        _;
    }

    modifier requireAuthorizedCaller()
    {
        require(msg.sender == authorizedContract, "CALLER_IS_NOT_AUTHORIZED");
        _;
    }



    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/




    function authorizeCaller
    (
        address _contract
    )
    external
    requireContractOwner
    {
        authorizedContract = _contract;
    }

    function getContractOwner
    (
    )
    view
    public
    returns (address)
    {
        return contractOwner;
    }


    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/


    function registrationNeedsVoting()
    public
    requireAuthorizedCaller
    view
    returns (bool)
    {
        return !(consensusThreshold > airlineIndex);
    }

    function registerAirline
    (
        address _airlineAddress,
        string memory _airlineName
    )
    requireAuthorizedCaller
    external
    returns (bool success, uint votes)
    {
        require(_airlineAddress != address(0), 'MISSING_AIRLINE_ADDRESS');
        require(!isRegistered(_airlineAddress), 'AIRLINE_ALREADY_REGISTERED');
        votes = 0;
        success = false;
        emit Console('register-0', uint(_airlineAddress), 'check if voting is needed');
        if (!registrationNeedsVoting()) {
            airlineData[_airlineAddress] = Airline(_airlineName, 2);
            success = true;
        } else {
            emit Console('register-1', uint(_airlineAddress), 'needs voting');
            VotingBox storage votingBox;
            votingBoxMap[_airlineAddress] = votingBox;
            uint counter = 0;
            for (uint i = 0; i < airlineIndex; i++) {
                address voterAddress = airlineList[i];
                Airline storage a = airlineData[voterAddress];
                if (a.status == 2) {
                    Ballot storage ballot;
                    votingBox.ballotList[counter] = ballot;
                    ballot.voterAddress = voterAddress;
                    ballot.vote = 0;
                    ballot.name = a.name;
                    if (ballot.voterAddress == address(0)) {
                        emit Console('register-2', 999, 'Address is null!!');
                    } else {
                        emit Console('register-2', 999, 'Address ok');
                    }
                    counter += 1;
                }
            }
            votingBox.size = counter;
            votes = counter;
            airlineData[_airlineAddress] = Airline(_airlineName, 1);
            success = true;
        }
        airlineList[airlineIndex] = _airlineAddress;
        airlineIndex += 1;
        Airline storage airline = airlineData[_airlineAddress];
        emit Registered(_airlineAddress, airline.name, airline.status);
        return (success, votes);
    }


    function isRegistered(address airline) public view returns (bool)
    {
        return airlineData[airline].status > 1;
    }

    function registrationStatus(
        address _airlineAddress
    )
    public
    view
    returns (uint)
    {
        return airlineData[_airlineAddress].status;
    }

    function isAirline(address airline) public view returns (bool)
    {
        return airlineData[airline].status > 0;
    }

    function numberOfAirlines() public view returns (uint)
    {
        return airlineIndex;
    }


    function getConsensusThreshold() public view returns (uint)
    {
        return consensusThreshold;
    }


    function getAirline(
        uint index
    )
    public
    view
    returns (string memory name, uint status)
    {
        require(index < airlineIndex, 'Wrong_Index');
        Airline memory a = airlineData[airlineList[index]];
        return (a.name, a.status);
    }


    function votingResultsByIndex(
        uint _index
    )
    public
    view
    returns (uint yes, uint no, uint open, uint voters)
    {
        require(_index < airlineIndex, 'WRONG_AIRLINE_INDEX');
        return votingResults(airlineList[_index]);
    }


    function votingResults
    (
        address _address
    )
    public
    view
    returns (uint yes, uint no, uint open, uint voters)
    {
        VotingBox storage votingBox = votingBoxMap[_address];
        yes = 0;
        no = 0;
        open = 0;
        for (uint i = 0; i < votingBox.size; i++) {
            Ballot storage ballot = votingBox.ballotList[i];
            if (ballot.vote == 0) {
                open += 1;
            }
            if (ballot.vote == 1) {
                yes += 1;
            }
            if (ballot.vote == 2) {
                no += 1;
            }
        }
        voters = votingBox.size;
        return (yes, no, open, voters);
    }


    function voteOnAirline
    (
        address _candidateAddress,
        address _voterAddress,
        uint _vote
    )
    public

    {
        require(_vote == 1 || _vote == 2, 'VOTE_SHOULD_BE_1_OR_2');
        require(_candidateAddress != address(0), 'EMPTY_CANDIDATE_ADDRESS');
        require(_voterAddress != address(0), 'EMPTY_VOTER_ADDRESS');
        Airline storage airline = airlineData[_candidateAddress];
        require(airline.status == 1, 'CANDIDATE_STATUS_NOT_1');
        VotingBox storage votingBox = votingBoxMap[_candidateAddress];
        emit Console('voting-0', votingBox.size, 'start');
        uint i = 0;
        uint yeses = 0;
        for (i = 0; i < votingBox.size; i++) {
            Ballot storage ballot = votingBox.ballotList[i];
            if (ballot.voterAddress == _voterAddress) {
                ballot.vote = _vote;
                emit Console('voting-1', _vote, 'in vote');
            }
            if (ballot.vote == 1) {
                yeses += 1;
            }
        }
        if (yeses >= votingBox.size / 2) {
            airline.status = 2;
            emit VotingEvent(_candidateAddress, airline.name, airline.status);
        }
    }

    //    ***
    //    INSURANCE SECTION
    //    ***

    uint paybackRatioPercentage = 150;

    struct FlightData {
        address airline;
        string flight;
        uint256 timestamp;
        mapping(address => uint) insurances;
        // 1 ok (initial)
        // 2 pay outs
        uint status;
        uint totalSum;
    }

    mapping(bytes32 => FlightData) flightData;
    bytes32[] flightKeys;


    /**
     * @dev Buy insurance for a flight
     *
     */
    function buyInsurance
    (
        address airline,
        string memory flight,
        uint256 timestamp,
        address insuree,
        uint amount
    )
    external
    requireAuthorizedCaller
    payable
    {

        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        require(amount > 0, 'Amount_needs_to_be_greater_than_0');
        require(amount > 0, 'Amount_needs_to_be_greater_than_0');
        require(flightData[flightKey].airline != address(0), 'Flight_does_no_exist');
        require(flightData[flightKey].insurances[insuree] == 0, 'Insuree_already_exists');


        address(this).transfer(amount);
        flightData[flightKey].insurances[insuree] = amount;

    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
    (
        address airline,
        string memory flight,
        uint256 timestamp
    )
    external
    requireAuthorizedCaller
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        require(flightData[flightKey].airline != address(0), 'Flight_does_no_exist');
        require(flightData[flightKey].status == 1, 'FlightData_wrong_status');
        flightData[flightKey].status = 2;
    }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
    (
        address airline,
        string memory flight,
        uint256 timestamp,
        address payable insuree
    )
    external
    payable
    {

        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        require(flightData[flightKey].airline != address(0), 'Flight_does_no_exist');
        require(flightData[flightKey].insurances[insuree] > 0, 'Insuree_does_no_exist_or_payout_done');
        require(flightData[flightKey].status != 2, 'No_payout');
        insuree.transfer(flightData[flightKey].insurances[insuree]);
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund
    (
    )
    public
    payable
    {
        Airline memory airline = airlineData[msg.sender];
        require(airline.status != 0, 'AIRLINE_NOT_REGISTERED');
        require(airline.status != 3, 'ALREADY_FUNDED');
        require(airline.status == 2, 'UNKNOWN_STATUS');
        require(msg.value >= MINIMAL_FUND, 'NOT_ENOUGH');

        payable(address(this)).transfer(MINIMAL_FUND);

        uint amountToReturn = msg.value.sub(MINIMAL_FUND);
        msg.sender.transfer(amountToReturn);
        airlineData[msg.sender].status = 3;
    }

    function getFlightKey
    (
        address airline,
        string memory flight,
        uint256 timestamp
    )
    pure
    internal
    returns (bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    fallback()
    external
    payable
    {

    }

    receive()
    external
    payable
    {

    }


}

