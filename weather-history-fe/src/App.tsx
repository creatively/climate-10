import React, { useEffect, useState, useRef } from 'react';
import { useEffectOnce } from './others-hooks/useEffectOnce'
import { useStore } from './weather-history-store'
import { VictoryChart, VictoryAxis, VictoryBar, VictoryTooltip, VictoryLabel, VictoryLine } from 'victory'
import { DateTime } from 'luxon'
import { Year, Years, YearsState } from './interfaces'
import APICalls from './APICalls'
import SearchBoxCustom from './SearchBoxCustom'
import './App.css'
import WebFont from 'webfontloader'
import { stringify } from 'querystring';


export default function App() {

  const { years, addYear } = useStore()
  const { oldYears, addOldYear } = useStore()
  const { clearYears, clearOldYears } = useStore()

  const [ axisYmin, setAxisYmin ] = useState<number>(0)
  const [ axisYmax, setAxisYmax ] = useState<number>(0)
  const [ averagesAcrossYears, setAveragesAcrossYears ] = useState<number[]>([])
  const [ plots, setPlots ] = useState<number[]>([])
  const [ plotsOld, setPlotsOld ] = useState<number[]>([])
  const [ oldAveragesAcrossYears, setOldAveragesAcrossYears ] = useState<number[]>([])
  const [ yearsIncrease, setYearsIncrease] = useState<number>(0)
  const [ address, setAddress ] = useState<string>('')
  const [ apiErrorMessage, setApiErrorMessage ] = useState<string>('') 
  const [ showResultsText, setShowResultsText ] = useState<boolean>(false)
  const [ showGraph, setShowGraph ] = useState<boolean>(false)
  const [ showLoader, setShowLoader ] = useState<boolean>(false)

  const weatherParameter: string = `tempmax`
  const yearsAgoStart: number = 0
  const oldYearsAgoStart: number = 10
  const numberOfDaysToGet: number = 365  // ^
  const numberOfYearsToGet: number = 5
  const numberOfTimepointsInAYear: number = 23
  const timepointsDayRange: number = 20 / 2


  interface ICityDetails {
    label: string,
    lat: string,
    lon: string,
    flag: string,
    regionCode: string
  }

  const c = (txt: any) => console.log(txt)


  // call once on first render
  useEffectOnce(() => {
    WebFont.load({google: {families: ['Monserrat','Volkhov']}});
  })

  // callback function from CustomSearchBox component
  function onSearchBoxUpdate(chosenCityDetails: ICityDetails) {
    setApiErrorMessage('')
    clearYears()
    clearOldYears()
    setShowGraph(false)
    setShowResultsText(false)
    setAddress(chosenCityDetails.label)
    setShowLoader(true)
    doApiCalls(chosenCityDetails.label)
  }

  // utility function - averages numbers
  function average(array: number[]) {
    let result = 0
    if (array.length > 0) {
      const total = array.reduce((prev, cur) => {
        return prev + cur;
      })
      result = Math.round(total / array.length)
    }
    return result
  }

  // when 'year' changes, update plots with new api-incoming 'year' data
  useEffect(() => {

    if (years.length > 0) {

      // when 'year' changes, obtain the latest min/max values to size the graph axis
      const arrMax: number[] = years.map(year => Math.max(...year.temperatures))
      setAxisYmax(Math.max(...arrMax) + 3)

      const arrMin: number[] = years.map(year => Math.min(...year.temperatures))
      setAxisYmin(Math.min(...arrMin) - 3)

      // when 'year' changes, calculate & set the running-average day temperature for x days over x years
      let arrayAverages: number[] = []
      for (let daysIndex: number = 0; daysIndex < numberOfDaysToGet; daysIndex++) {
        let arrayDays: number[] = []
        for (let yearsIndex=0; yearsIndex<numberOfDaysToGet; yearsIndex++) {
          if (years[yearsIndex] && years[yearsIndex]?.temperatures[daysIndex]) {
            arrayDays.push(years[yearsIndex].temperatures[daysIndex])
          }
        }
        if (arrayDays.length > 0) {
          arrayAverages.push(average(arrayDays))
        }
      }

      // when the array of day values is ready (arrayAverages), convert it to an array of month average values (arrayMonthAverages)
      const plottableAverages: number[] = getPlottableAveragesFromDayAverages(arrayAverages)

      // when the array to plot (arrayToPlot) is complete, set 'plots'
      setPlots(plottableAverages)
    }

  }, [ years ])


  // when oldYears changes
  useEffect(() => {

    if (oldYears.length > 0) {

      // calculate & set the running-average temperature for x days over x years
      let arrayAverages: number[] = []
      for (let daysIndex: number = 0; daysIndex < numberOfDaysToGet; daysIndex++) {
        let arrayDay: number[] = []
        for (let oldYearsIndex=0; oldYearsIndex<numberOfDaysToGet; oldYearsIndex++) {
          if (oldYears[oldYearsIndex] && oldYears[oldYearsIndex]?.temperatures[daysIndex]) {
            arrayDay.push(oldYears[oldYearsIndex]?.temperatures[daysIndex])
          }
        }
        if (arrayDay?.length > 0) {
          arrayAverages.push(average(arrayDay))
        }
      }

      const arrayMonthAverages: number[] = [1,1,1,1,1,1,1,1,1,1,1,1]
      setOldAveragesAcrossYears(arrayMonthAverages)
    }

  }, [ oldYears ])


  // get timepoint/plottable averages from day averages
  function getPlottableAveragesFromDayAverages(dayAverages: number[]) {
    const results: number[] = []
    const daysBetweenTimepoints: number = 30
    const daysAroundTimepoints: number = 15

    // get averageForNewYear period (dec -> jan)
    function getAverageOverNewYear(dayAverages: number[]) {
      let total = 0
      for (let dayIndex=357; dayIndex<365; dayIndex++) {
        total += dayAverages[dayIndex]
      }
      for (let dayIndex=0; dayIndex<8; dayIndex++) {
        total += dayAverages[dayIndex]
      }
      return total / 16
    }
    const averageForNewYear: number = getAverageOverNewYear(dayAverages)

    // get average for a specified range of days
    function getAverageOfDayRange(indexFirst: number, indexLast: number, arrayAverages: number[]) {
      let result: number = 0
      for (let dayIndex = indexFirst; dayIndex < indexLast; dayIndex++) {
        result += dayAverages[dayIndex]
      }
      return result / (indexLast - indexFirst)
    }

    // add the average for the new year period as the 1st timepoint
    results.push(averageForNewYear)

    // add the averages for each timepoint in the year
    for (let timepointDayIndex = daysBetweenTimepoints; timepointDayIndex < 365; timepointDayIndex += daysBetweenTimepoints) {
      if (timepointDayIndex + daysAroundTimepoints < 365) {
        const firstDayIndex: number = Math.max(0, timepointDayIndex - timepointsDayRange)
        const lastDayIndex: number = Math.min(365, timepointDayIndex + timepointsDayRange)

        // get average of all days in the timepoint's range
        const midpointDaysAway = 14
        const averageForTimepoint: number = getAverageOfDayRange(firstDayIndex, lastDayIndex, dayAverages)
        const averageOfThisAndLastEntry = getAverageOfDayRange(firstDayIndex - midpointDaysAway, lastDayIndex - midpointDaysAway, dayAverages)
        
        results.push(averageOfThisAndLastEntry)
        results.push(averageForTimepoint)
      }
    }

    // add the average for the new year period as the last timepoint
    results.push(averageForNewYear)
    results.push(averageForNewYear)

    return results
  }

  
  // when either years or oldYears changes
  useEffect(() => {

    const newTempsTotal: number = 
      average(years.map((year) => {
        return year.temperatures.reduce((dayTemperatureSoFar: number, nextDayTemperature: number) => {
          return dayTemperatureSoFar + nextDayTemperature
        })
      }))

    const oldTempsTotal: number = 
      average(oldYears.map((year) => {
        return year.temperatures.reduce((dayTemperatureSoFar: number, nextDayTemperature: number) => {
          return dayTemperatureSoFar + nextDayTemperature
        })
      }))

    const increase: number = Number(((newTempsTotal - oldTempsTotal) / 365).toFixed(1))
    setYearsIncrease(increase)

    if (years.length > 0 && oldYears.length > 0) {
      setShowGraph(true)
      setShowLoader(false)
    }
    if (years.length === numberOfYearsToGet && oldYears.length === numberOfYearsToGet) {
      setShowResultsText(true)
    }

  }, [ years, oldYears])

  useEffect(() => {
    if (apiErrorMessage !== '') {
      setShowLoader(false)
      setShowGraph(false)
    }
  }, [ apiErrorMessage ])


  function doApiCalls(address: string) {
    APICalls(
      address, 
      yearsAgoStart, 
      oldYearsAgoStart, 
      numberOfYearsToGet, 
      addYear, 
      addOldYear,
      setApiErrorMessage,
      weatherParameter
    )
  }


  return (

    <div className="App">
      <div className="main">

        <h2>Find how much your local climate has changed in 10 years</h2>

        <div className="search-box-container">
          <SearchBoxCustom onSearchBoxUpdate={onSearchBoxUpdate} />
          { showResultsText ?
            <div className="results-text">+ { yearsIncrease }'C</div>
            : `` 
          }

          { apiErrorMessage !== '' 
            ? <div className="api-error">{ apiErrorMessage }</div>
            : ``
          }
        </div>

        { showGraph ? 

        <>
          <div className="key-years">
            <div className="old-years">2006-2011</div><div className="key-years-text">compared with</div><div className="new-years">2016-2021</div>
          </div>

          <div className="charts-container">
            <div className="chart-container-days">

              <VictoryChart
                padding={{ top: 0, bottom: 0 }}
              >           

                {years.map((year: Year, index: number) => (
                  <VictoryLine
                    key={`key_days_${index}`}
                    interpolation="natural"
                    data={year.temperatures}
                    label={year.year.toString()}
                    style={{
                      data: {
                        stroke: "#eee",
                        strokeWidth: 1
                      }
                    }}
                  />
                ))}

                {oldYears.map((oldYear: Year, index: number) => (
                  <VictoryLine
                    key={`key_days_old_${index}`}
                    interpolation="natural"
                    data={oldYear.temperatures}
                    label={oldYear.year.toString()}
                    style={{
                      data: {
                        stroke: "#e5e5e5",
                        strokeWidth: 1
                      }
                    }}
                  />
                ))}

                <VictoryAxis
                  domain={[0,13]} 
                  axisLabelComponent={<VictoryLabel dy={5} />}
                  tickLabelComponent={<VictoryLabel dy={-7} style={{fontSize: '10px'}} />}
                  tickValues={[]}
                  tickFormat={['']}
                />
                <VictoryAxis dependentAxis
                  label={``}
                  tickFormat={[0]}
                  domain={[axisYmin,axisYmax]}
                  axisLabelComponent={<VictoryLabel dy={-11} />}
                  tickLabelComponent={<VictoryLabel dy={0} style={{fontSize: '10px'}} />}
                  style={{
                    axisLabel: {
                      fontSize: 12,
                      padding: 30
                    },
                    grid: {
                      stroke: "#bbb",
                      strokeWidth: 0
                    }
                  }}
                />

              </VictoryChart>
            </div>
          





            <div className="chart-container-averages">
              <VictoryChart
                padding={{ top: 0, bottom: 0 }}
              >  

                <VictoryLine
                  key={`key_averages`}
                  interpolation="natural"
                  data={plots}
                  style={{
                    data: {
                      stroke: "crimson",
                      strokeWidth: 1
                    }
                  }}
                />
                <VictoryLine
                  key={`key_old_averages`}
                  interpolation="natural"
                  data={oldAveragesAcrossYears}
                  style={{
                    data: {
                      stroke: "dodgerblue",
                      strokeWidth: 1
                    }
                  }}
                />

                <VictoryAxis
                  domain={[0,24]} 
                  axisLabelComponent={<VictoryLabel dy={5} />}
                  tickLabelComponent={<VictoryLabel dy={-7} style={{fontSize: '10px'}} />}
                  tickValues={[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]}
                  tickFormat={['','Jan','','Feb','','Mar','','Apr','','May','','Jun','','Jul','','Aug','','Sep','','Oct','','Nov','','Dec','']}
                />
                <VictoryAxis dependentAxis
                  label={`Daily maximum temperature 'C`}
                  tickFormat={[-30,-25,-20,-15,-10,-5,0,5,10,15,20,25,30,35,40,45,50]}
                  domain={[axisYmin,axisYmax]}
                  axisLabelComponent={<VictoryLabel dy={-11} />}
                  tickLabelComponent={<VictoryLabel dy={0} style={{fontSize: '10px'}} />}
                  style={{
                    axisLabel: {
                      fontSize: 12,
                      padding: 30
                    },
                    grid: {
                      stroke: "#bbb",
                      strokeWidth: 1
                    }
                  }}
                />

              </VictoryChart>

            </div>
          </div>
        </>
        : ``
      }
      
      { showLoader ? 
          <div className="loader-container">
            <img src="https://miro.medium.com/max/400/1*em5HcTFZIQw90qIgdbYjVg.gif" alt="loading" height="200" width="260" />
          </div>
        : `` 
      }

      </div>
    </div>
  )
}
