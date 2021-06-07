// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "../node_modules/@openzeppelin/contracts/math/SafeMath.sol";
import "./FlightSuretyData.sol";
import "./Utils.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp is Utils {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner;          // Account used to deploy contract
    address payable private dataContract;

    bool private operational = true;


    FlightSuretyData private fsData;

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
    }

    mapping(bytes32 => Flight) private flights;


    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        // Modify to call data contract's status
        require(operational, "CONTRACT_IS_CURRENTLY_NOT_OPERATIONAL");
        _;
        // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "CALLER_IS_NOT_CONTRACT_OWNER");
        _;
    }

    modifier requireDataContract()
    {
        require(address(fsData) != address(0), 'NO_DATA_CONTRACT');
        _;
    }



    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    constructor (address _dataContract) public
    {
        dataContract = payable(_dataContract);
        fsData = FlightSuretyData(payable(dataContract));
        contractOwner = msg.sender;
    }




    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/


    function setDataContract
    (
        address payable _dataContract
    )
    external
    requireContractOwner
    {
        dataContract = _dataContract;
        fsData = FlightSuretyData(payable(dataContract));
    }




    // Modify to call data contract's status
    function isOperational()
    public
    view
    returns (bool)
    {
        return operational;
    }

    function setOperational(bool _operational) public requireContractOwner {
        operational = _operational;
    }

    function getDataContract() public view returns (address){
        return dataContract;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/


    function registerAirline(address _airlineAddress, string memory _airlineName)
    external
    payable
    requireIsOperational
    returns (bool success, uint votes)
    {
        require(dataContract != address(0), 'NO_DATA_CONTRACT_DEFINED');

        if (!fsData.registrationNeedsVoting() && fsData.numberOfAirlines() > 0) {
            require(fsData.isRegistered(msg.sender), 'SENDER_NEEDS_TO_BE_REGISTERED_AIRLINE');
        }
        return fsData.registerAirline(_airlineAddress, _airlineName);
    }

    function isRegistered(address _address) public view requireDataContract returns (bool)
    {
        return fsData.isRegistered(_address);
    }

    function registrationStatus(address _address)
    public
    view
    requireDataContract
    returns (uint)
    {
        return fsData.registrationStatus(_address);
    }


    function isAirline(address _address) public view requireDataContract returns (bool)
    {
        return fsData.isAirline(_address);
    }

    function voteOnAirline
    (
        address _candidateAddress,
        address _voterAddress,
        uint _vote
    )
    public requireDataContract
    {
        require(_voterAddress == msg.sender, 'ONLY_SENDER_CAN_VOTE');

        return fsData.voteOnAirline(_candidateAddress, _voterAddress, _vote);
    }


    function votingResultsByIndex(
        uint _index
    )
    public
    view
    requireDataContract
    returns (uint, uint, uint, uint)
    {
        return fsData.votingResultsByIndex(_index);
    }


    function votingResults(address _address)
    public
    view
    requireDataContract
    returns (uint, uint, uint, uint)
    {
        return fsData.votingResults(_address);
    }




    /**
     * @dev Register a future flight for insuring.
     *
     */
    function registerFlight
    (
    )
    external
    pure
    {

    }

    /**
     * @dev Called after oracle has updated flight status
     *
     */
    function processFlightStatus
    (
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    )
    internal
    {
        if (statusCode > 10) {
            fsData.creditInsurees(airline, flight, timestamp);
        }
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
    (
        address airline,
        string memory flight,
        uint256 timestamp
    )
    external
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
        requester : msg.sender,
        isOpen : true
        });

        emit OracleRequest(index, airline, flight, timestamp);
    }


    // region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 0.0001 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
        // This lets us group responses and identify
        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    function registerOracle
    (
    )
    external
    payable
    {
        require(!isOracleRegistered(), "ORACLE_ALREADY_REGISTERED");
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");
        dataContract.transfer(REGISTRATION_FEE);

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
        isRegistered : true,
        indexes : indexes
        });
    }


    function isOracleRegistered()
    view
    public
    returns (bool)
    {
        return oracles[msg.sender].isRegistered;
    }


    function getMyIndexes()
    view
    external
    returns (uint8[3] memory)
    {
        require(oracles[msg.sender].isRegistered, "Not_registered_as_an_oracle");
        return oracles[msg.sender].indexes;
    }



    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
    (
        uint8 index,
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    )
    external
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {
            oracleResponses[key].isOpen = false;
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
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

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
    (
        address account
    )
    internal
    returns (uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
    (
        address account
    )
    internal
    returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;
            // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

    // endregion

}
