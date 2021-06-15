module.exports = { printAirlines };

async function printAirlines(flightSuretyData) {
  let nrOfAirlines = await flightSuretyData.numberOfAirlines();
  console.log('*** nr of airlines:', nrOfAirlines.toString());
  for (let i = 0; i < nrOfAirlines; i++) {
    let airline = await flightSuretyData.getAirlineByIndex(i);
    let voteApproval = await flightSuretyData.votingResultsByIndex(i);
    let isFunded = await flightSuretyData.isFunded(airline.airlineAddress);
    console.log('***');
    console.log(i, ' Airline name:', airline.airlineName);
    console.log('Airline status:', airline.airlineStatus.toString());
    console.log(
      'Airline voters-yes-no-open:',
      'yes:',
      voteApproval[0].toString(),
      '; no:',
      voteApproval[1].toString(),
      '; open:',
      voteApproval[2].toString(),
      '; voters:',
      voteApproval[3].toString()
    );
    console.log('Airline is funded:', isFunded);
  }
}
