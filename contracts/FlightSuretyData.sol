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

    uint private MINIMAL_FUND = 0.001 ether;

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
        uint index;
        // 0 not voted
        // 1 approve
        // 2 disapprove
        uint vote;
    }

    struct VotingBox {
        mapping(uint => Ballot) ballotList;
        uint ballotSize;
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
        // DEV require(msg.sender == contractOwner || msg.sender == authorizedContract, "CALLER_IS_NOT_CONTRACT_OWNER");
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

    function getBallotSize
    (
        address _address
    )
    view
    public
    returns (uint)
    {
        VotingBox storage votingBox = votingBoxMap[_address];
        return votingBox.ballotSize;
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
        if (!registrationNeedsVoting()) {
            airlineData[_airlineAddress] = Airline(_airlineName, 2);
            success = true;
        } else {
            emit Console('register-1', uint(_airlineAddress), 'needs voting');
            uint counter = 0;
            for (uint i = 0; i < airlineIndex; i++) {
                address voterAddress = airlineList[i];
                Airline storage a = airlineData[voterAddress];
                if (a.status == 2) {
                    votingBoxMap[_airlineAddress].ballotList[counter].voterAddress = voterAddress;
                    votingBoxMap[_airlineAddress].ballotList[counter].name = a.name;
                    votingBoxMap[_airlineAddress].ballotList[counter].vote = 0;
                    votingBoxMap[_airlineAddress].ballotList[counter].index = counter;
                    counter += 1;
                }
            }
            votingBoxMap[_airlineAddress].ballotSize = counter;
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


    function getAirlineByIndex(
        uint index
    )
    public
    view
    returns (address airlineAddress, string memory airlineName, uint airlineStatus)
    {
        require(index < airlineIndex, 'WRONG_INDEX');
        airlineAddress = airlineList[index];
        Airline storage a = airlineData[airlineAddress];
        airlineName = a.name;
        airlineStatus = a.status;
        return (airlineAddress, airlineName, airlineStatus);
    }


    function getAirlineByAddress(
        address _address
    )
    public
    view
    returns (string memory airlineName, uint airlineStatus)
    {
        Airline storage airline = airlineData[_address];
        require(airline.status == 0, 'WRONG_ADDRESS');
        airlineName = airline.name;
        airlineStatus = airline.status;
        return (airlineName, airlineStatus);
    }


    function votingResultsByIndex(
        uint _index
    )
    public
    view
    returns (uint, uint, uint, uint)
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
        for (uint i = 0; i < votingBox.ballotSize; i++) {
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
        voters = votingBox.ballotSize;
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
        uint i = 0;
        uint yeses = 0;
        for (i = 0; i < votingBox.ballotSize; i++) {
            Ballot storage ballot = votingBox.ballotList[i];
            emit Console('voting-1', uint(ballot.voterAddress), 'voterAddress');
            if (ballot.voterAddress == _voterAddress) {
                ballot.vote = _vote;
                emit Console('voting-1', _vote, 'in vote');
            }
            if (ballot.vote == 1) {
                yeses += 1;
            }
        }
        if (yeses >= (votingBox.ballotSize + 1) / 2) {
            airline.status = 2;
            emit VotingEvent(_candidateAddress, airline.name, airline.status);
        }
    }

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


    //
    // FLIGHT
    //

    function registerFlight
    (
        address _airline, string memory _flight, uint256 _timestamp
    )
    external
    requireAuthorizedCaller
    {
        bytes32 flightKey = getFlightKey(_airline, _flight, _timestamp);
        require(flightData[flightKey].airline == address(0), 'FLIGHT_ALREADY_REGISTERED');
        flightData[flightKey].airline = _airline;
        flightData[flightKey].timestamp = _timestamp;
        flightData[flightKey].flight = _flight;
        flightKeys.push(flightKey);
    }


    function getNumberOfFlights
    (

    )
    public
    view
    returns (uint)
    {
        return flightKeys.length;
    }


    function getFlightByIndex
    (
        uint index
    )
    public
    view
    returns (address airline, string memory flight, uint timestamp)
    {
        airline = flightData[flightKeys[index]].airline;
        flight = flightData[flightKeys[index]].flight;
        timestamp = flightData[flightKeys[index]].timestamp;
        return (airline, flight, timestamp);
    }

    function isFlightRegistered
    (
        address _airline, string memory _flight, uint256 _timestamp
    )
    public
    view
    returns (bool)
    {
        bytes32 flightKey = getFlightKey(_airline, _flight, _timestamp);
        return flightData[flightKey].airline != address(0);
    }


    //
    // INSURANCE
    //

    function isInsured
    (
        address airline,
        string memory flight,
        uint256 timestamp,
        address insuree
    )
    public
    view
    returns (bool)
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        return flightData[flightKey].insurances[insuree] != 0;
    }

    function registerInsurance(
        address airline,
        string memory flight,
        uint256 timestamp,
        address insuree,
        uint amount
    )
    external
    requireAuthorizedCaller
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        require(flightData[flightKey].airline != address(0), 'FLIGHT_DOES_NO_EXIST');
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
        require(flightData[flightKey].airline != address(0), 'FLIGHT_DOES_NO_EXIST');
        require(flightData[flightKey].insurances[insuree] > 0, 'INSUREE_DOES_NO_EXIST_OR_PAYOUT_DONE');
        require(flightData[flightKey].status != 2, 'NO_PAYOUT');
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

