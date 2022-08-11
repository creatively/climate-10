import React, { useEffect, useState } from 'react';
import { useStore } from './weather-history-store'
import { VictoryChart, VictoryLine } from 'victory'
import { DateTime } from 'luxon'
import { Year, Years, YearsState } from './interfaces'
import './App.css';


const numberOfPastYears: number = 10;
const c = (txt: string | number) => console.log(txt)

function App() {

  //const { years, addYear } = useStore()
  

  function getDataAndUpdateUI(numberOfPastYears: number, startMMDD: string, endMMDD: string): void  {
        
        const currentYear = DateTime.now().year
        const apiUrls: string[] = []
    
        for(let index=0; index<numberOfPastYears; index++) {
            const dataYear: number = currentYear - index 
            const startYYYYMMDD: string = `${dataYear}-${startMMDD}`
            const endYYYYMMDD: string = `${dataYear}-${endMMDD}`
            // expect a bug here where startDate is between Dec 16 & Dec 31, as year overlap
            
            const apiUrl: string = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline
                /cardiff
                /${startYYYYMMDD}
                /${endYYYYMMDD}
                ?unitGroup=uk&key=ZG6RTP56DLKZJ8LWJCLVK4RM7&contentType=json`
            apiUrls.push(apiUrl)
        }
    
        // >>>>>> next : do api calls here <<<<<
        
        console.log(apiUrls)
        //addYear(2019, [1,2,3,4,5,4,3,2,1,2])
        console.log(years.length)
    }

  const [ years, setYears ] = useState<Year[]>([])
  const [ axisYmin, setAxisYmin ] = useState<number>(0)
  const [ axisYmax, setAxisYmax ] = useState<number>(0)

  // get min & max for graph axis Y
  useEffect(() => {
    if (years.length > 0) {
      const arrMax: number[] = years.map(year => Math.max(...year.temperatures))
      setAxisYmax(Math.max(...arrMax) + 1)

      const arrMin: number[] = years.map(year => Math.min(...year.temperatures))
      setAxisYmin(Math.min(...arrMin) - 1)
    }
  }, [ years ])

  useEffect(() => {
    //getDataAndUpdateUI(numberOfPastYears, `08-10`, `08-20`)

    // temp test content, to be replaced with api data
    const y1: Year = {
      year: 2019,
      temperatures: [29,28,28,26,23,21,25,27,26,26] 
    }
    const y2: Year = {
      year: 2020,
      temperatures: [21,21,20,20,18,21,24,24,22,23] 
    }
    setYears([y1, y2])
  }, [])


  return (

    <div className="App">
      
      <VictoryChart
        maxDomain={{ y: axisYmax }}
        minDomain={{ y: axisYmin }}
        
      >
        {years.map((year, index) => (

          <VictoryLine
            interpolation="natural"
            data={year.temperatures}
            style={{
              data: {
                stroke: "#ddd"
              }
            }}
          />
        
        ))}
      </VictoryChart>
        
    </div>
  );
}

export default App;
