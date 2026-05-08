// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AnomalyLogger {
    struct Anomaly {
        string url;
        string dataHash;
        uint256 timestamp;
    }

    Anomaly[] public anomalies;

    event AnomalyLogged(string url, string dataHash, uint256 timestamp);

    function logAnomaly(string memory _url, string memory _dataHash, uint256 _timestamp) public {
        anomalies.push(Anomaly({
            url: _url,
            dataHash: _dataHash,
            timestamp: _timestamp
        }));
        emit AnomalyLogged(_url, _dataHash, _timestamp);
    }

    function getAnomaliesCount() public view returns (uint256) {
        return anomalies.length;
    }

    function getAnomaly(uint256 index) public view returns (string memory, string memory, uint256) {
        require(index < anomalies.length, "Index out of bounds");
        Anomaly memory anomaly = anomalies[index];
        return (anomaly.url, anomaly.dataHash, anomaly.timestamp);
    }
}
