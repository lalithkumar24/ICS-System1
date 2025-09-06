// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract IncidentCommandSystem {
    address public commandCenter;
    uint256 private incidentCounter;
    
    enum IncidentStatus { 
        REPORTED, 
        ASSIGNED, 
        IN_PROGRESS, 
        RESOLVED, 
        CLOSED 
    }
    
    enum PersonnelRole { 
        INCIDENT_COMMANDER, 
        OPERATIONS_CHIEF, 
        SAFETY_OFFICER, 
        FIRST_RESPONDER 
    }
    
    struct Personnel {
        address walletAddress;
        string name;
        PersonnelRole role;
        bool isActive;
        uint256 currentIncident;
    }
    
    struct Incident {
        uint256 id;
        string description;
        string location;
        IncidentStatus status;
        address assignedPersonnel;
        uint256 reportedTime;
        uint256 resolvedTime;
        address reportedBy;
    }
    
    mapping(uint256 => Incident) public incidents;
    mapping(address => Personnel) public personnel;
    mapping(address => bool) public authorizedPersonnel;
    
    event IncidentReported(uint256 indexed incidentId, string description, string location);
    event PersonnelAssigned(uint256 indexed incidentId, address indexed personnel);
    event StatusUpdated(uint256 indexed incidentId, IncidentStatus newStatus);
    event PersonnelRegistered(address indexed personnel, string name, PersonnelRole role);
    event CommandCenterTransferred(address indexed oldCommandCenter, address indexed newCommandCenter);
    
    modifier onlyCommandCenter() {
        require(msg.sender == commandCenter, "Only command center can execute");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedPersonnel[msg.sender], "Not authorized personnel");
        _;
    }
    
    modifier validIncident(uint256 incidentId) {
        require(incidentId > 0 && incidentId <= incidentCounter, "Invalid incident ID");
        _;
    }
    
    constructor() {
        commandCenter = msg.sender;
        authorizedPersonnel[msg.sender] = true;
    }
    
    function registerPersonnel(
        address _personnel, // <-- Renamed this parameter
        string memory name,
        PersonnelRole role
    ) external onlyCommandCenter {
        require(_personnel != address(0), "Personnel address cannot be zero");
    
        // Now 'personnel' is the mapping and '_personnel' is the address key
        personnel[_personnel] = Personnel({
            walletAddress: _personnel, // <-- Also use the new name here
            name: name,
            role: role,
            isActive: true,
            currentIncident: 0
        });
    
    authorizedPersonnel[_personnel] = true; // <-- And here
    emit PersonnelRegistered(_personnel, name, role); // <-- And here
}
    
    function reportIncident(
        string memory description,
        string memory location
    ) external onlyAuthorized returns (uint256) {
        incidentCounter++;
        
        incidents[incidentCounter] = Incident({
            id: incidentCounter,
            description: description,
            location: location,
            status: IncidentStatus.REPORTED,
            assignedPersonnel: address(0),
            reportedTime: block.timestamp,
            resolvedTime: 0,
            reportedBy: msg.sender
        });
        
        emit IncidentReported(incidentCounter, description, location);
        return incidentCounter;
    }
    
    function assignPersonnel(
        uint256 incidentId,
        address personnelAddress
    ) external onlyCommandCenter validIncident(incidentId) {
        require(personnelAddress != address(0), "Personnel address cannot be zero");
        require(authorizedPersonnel[personnelAddress], "Personnel not authorized");
        require(personnel[personnelAddress].isActive, "Personnel not active");
        require(personnel[personnelAddress].currentIncident == 0, "Personnel already assigned");
        
        incidents[incidentId].assignedPersonnel = personnelAddress;
        incidents[incidentId].status = IncidentStatus.ASSIGNED;
        personnel[personnelAddress].currentIncident = incidentId;
        
        emit PersonnelAssigned(incidentId, personnelAddress);
        emit StatusUpdated(incidentId, IncidentStatus.ASSIGNED);
    }
    
    function updateIncidentStatus(
        uint256 incidentId,
        IncidentStatus newStatus
    ) external onlyAuthorized validIncident(incidentId) {
        Incident storage incident = incidents[incidentId];
        
        // Only assigned personnel or command center can update
        require(
            msg.sender == incident.assignedPersonnel || msg.sender == commandCenter,
            "Not authorized to update this incident"
        );
        
        incident.status = newStatus;
        
        if (newStatus == IncidentStatus.RESOLVED || newStatus == IncidentStatus.CLOSED) {
            incident.resolvedTime = block.timestamp;
            
            // Free up personnel if assigned
            address assignedPersonnel = incident.assignedPersonnel;
            if (assignedPersonnel != address(0)) {
                personnel[assignedPersonnel].currentIncident = 0;
            }
        }
        
        emit StatusUpdated(incidentId, newStatus);
    }
    
    function getIncident(uint256 incidentId) 
        external 
        view 
        validIncident(incidentId) 
        returns (
            uint256 id,
            string memory description,
            string memory location,
            IncidentStatus status,
            address assignedPersonnel,
            uint256 reportedTime,
            uint256 resolvedTime
        ) 
    {
        Incident memory incident = incidents[incidentId];
        return (
            incident.id,
            incident.description,
            incident.location,
            incident.status,
            incident.assignedPersonnel,
            incident.reportedTime,
            incident.resolvedTime
        );
    }
    
    function getPersonnelInfo(address personnelAddress) 
        external 
        view 
        returns (
            string memory name,
            PersonnelRole role,
            bool isActive,
            uint256 currentIncident
        ) 
    {
        Personnel memory person = personnel[personnelAddress];
        return (person.name, person.role, person.isActive, person.currentIncident);
    }
    
    function getTotalIncidents() external view returns (uint256) {
        return incidentCounter;
    }
    
    function deactivatePersonnel(address personnelAddress) external onlyCommandCenter {
        require(personnelAddress != address(0), "Personnel address cannot be zero");
        personnel[personnelAddress].isActive = false;
        
        // If personnel is assigned to an incident, free them up
        uint256 assignedIncident = personnel[personnelAddress].currentIncident;
        if (assignedIncident != 0) {
            incidents[assignedIncident].assignedPersonnel = address(0);
            personnel[personnelAddress].currentIncident = 0;
        }
    }
    
    function transferCommandCenter(address newCommandCenter) external onlyCommandCenter {
        require(newCommandCenter != address(0), "New command center cannot be zero address");
        require(newCommandCenter != commandCenter, "New command center must be different");
        
        address oldCommandCenter = commandCenter;
        commandCenter = newCommandCenter;
        authorizedPersonnel[newCommandCenter] = true;
        
        emit CommandCenterTransferred(oldCommandCenter, newCommandCenter);
    }
}
