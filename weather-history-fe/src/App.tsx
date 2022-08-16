import React, { useEffect, useState } from 'react';
import { useEffectOnce } from './others-hooks/useEffectOnce'
import { useStore } from './weather-history-store'
import { VictoryChart, VictoryLine } from 'victory'
import { DateTime } from 'luxon'
import { Year, Years, YearsState } from './interfaces'
import APICalls from './APICalls'
import './App.css';


const numberOfPastYears: number = 10;
const c = (txt: string | number) => console.log(txt)

export default function App() {

  const { years, addYear } = useStore()
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

  useEffectOnce(() => {
    APICalls('london', 10, '08-01', '08-31', addYear)
  })


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
  )
}

