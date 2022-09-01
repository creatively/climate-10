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
  const [ oldAveragesAcrossYears, setOldAveragesAcrossYears ] = useState<number[]>([])
  const [ yearsIncrease, setYearsIncrease] = useState<number>(0)
  const [ address, setAddress ] = useState<string>('')
  const [ apiError, setApiError ] = useState<boolean>(false)
  const [ showResultsText, setShowResultsText ] = useState<boolean>(false)
  const [ showGraph, setShowGraph ] = useState<boolean>(false)
  const [ showLoader, setShowLoader ] = useState<boolean>(false)

  const weatherParameter: string = `tempmax`
  const yearsAgoStart: number = 0
  const oldYearsAgoStart: number = 10
  const startDateMMDD: string = `01-01`
  const finishDateMMDD: string = `12-31`
  const numberOfDaysToGet: number = 365  // ^
  const numberOfYearsToGet: number = 5
  const runningAverageSpread: number = 20


  interface ICityDetails {
    label: string,
    lat: string,
    lon: string,
    flag: string,
    regionCode: string
  }


  // call once on first render
  useEffectOnce(() => {
    WebFont.load({google: {families: ['Monserrat','Volkhov']}});
  })

  // callback function from CustomSearchBox component
  function onSearchBoxUpdate(chosenCityDetails: ICityDetails) {
    console.log(`--- onSearchBoxUpdate function called`)
    console.log(chosenCityDetails)
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

  // utility function - running-average array from an array of numbers
  function getRunningAverages(arrayOfNumbers: number[], spreadSize: number) {
    let arrayRunningAveragedItems: number[] = []

    // average-out initial items in the array before spreadSize is reached
    for (let itemIndex: number=0; itemIndex < spreadSize; itemIndex++) { 
      let cumulativeTotalOfCurrentNumber: number = 0
      for (let positionIndex: number=0; positionIndex < itemIndex; positionIndex++) {
          cumulativeTotalOfCurrentNumber += arrayOfNumbers[positionIndex]
      }
      const runningAveragedItem: number = Math.round(cumulativeTotalOfCurrentNumber / itemIndex)
      arrayRunningAveragedItems.push(runningAveragedItem)
    }

    // average-out all other items
    for (let itemIndex: number = spreadSize - 1; itemIndex < arrayOfNumbers.length; itemIndex++) { 
      let cumulativeTotalOfCurrentNumber: number = 0
      for (let positionIndex: number = 0; positionIndex < spreadSize; positionIndex++) {
          const indexOfItemToAdd: number = itemIndex - positionIndex
          cumulativeTotalOfCurrentNumber += arrayOfNumbers[indexOfItemToAdd]
      }
      const runningAveragedItem: number = Math.round(cumulativeTotalOfCurrentNumber / spreadSize)
      arrayRunningAveragedItems.push(runningAveragedItem)
    }

    // return the running averages array
    return arrayRunningAveragedItems.filter(item => item === Number(item))
  }


  // when year changes
  useEffect(() => {

    if (years.length > 0) {

      // when 'year' changes, obtain the latest min/max values to size the graph axis
      const arrMax: number[] = years.map(year => Math.max(...year.temperatures))
      setAxisYmax(Math.max(...arrMax) + 3)

      const arrMin: number[] = years.map(year => Math.min(...year.temperatures))
      setAxisYmin(Math.min(...arrMin) - 3)

      // calculate & set the running-average temperature for x days over x years
      let arrayAverages: number[] = []
      for (let daysIndex: number = 0; daysIndex < numberOfDaysToGet; daysIndex++) {
        let arrayDay: number[] = []
        for (let yearsIndex=0; yearsIndex<numberOfDaysToGet; yearsIndex++) {
          if (years[yearsIndex] && years[yearsIndex]?.temperatures[daysIndex]) {
            arrayDay.push(years[yearsIndex]?.temperatures[daysIndex])
          }
        }
        if (arrayDay?.length > 0) {
          arrayAverages.push(average(arrayDay))
        }
      }
      const arrayRunningAveraged: number[] = getRunningAverages(arrayAverages, runningAverageSpread)
      setAveragesAcrossYears(arrayRunningAveraged)
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
      const arrayRunningAveraged: number[] = getRunningAverages(arrayAverages, runningAverageSpread)
      setOldAveragesAcrossYears(arrayRunningAveraged)
    }

  }, [ oldYears ])

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
    if (apiError === true) {
      setShowLoader(false)
      setShowGraph(false)
    }
  }, [ apiError ])


  function doApiCalls(address: string) {
    APICalls(
      address, 
      yearsAgoStart, 
      oldYearsAgoStart, 
      numberOfYearsToGet, 
      startDateMMDD, 
      finishDateMMDD, 
      addYear, 
      addOldYear,
      setApiError,
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
        </div>

        { showGraph ? 

        <>
          <div className="key-years">
            <div className="old-years">2006-2011</div><div className="key-years-text">compared with</div><div className="new-years">2016-2021</div>
          </div>

          <div className="chart-container">

            <VictoryChart
              padding={{ top: 0, bottom: 0 }}
            >

              {years.map((year: Year, index: number) => (
                <VictoryLine
                  key={`key_year_${index}`}
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
                  key={`key_oldyear_${index}`}
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

              <VictoryLine
                key={`key_averages`}
                interpolation="natural"
                data={averagesAcrossYears}
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
                domain={[0,365]} 
                axisLabelComponent={<VictoryLabel dy={5} />}
                tickLabelComponent={<VictoryLabel dy={-7} style={{fontSize: '10px'}} />}
                tickValues={[15, 46, 74, 105, 135, 167, 197, 227, 257, 288, 319, 349]}
                tickFormat={['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']}
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
        </>

        : ``
      }
      
      { showLoader ? 
          <div className="loader-container">
            <img src="https://miro.medium.com/max/400/1*em5HcTFZIQw90qIgdbYjVg.gif" alt="loading" height="200" width="260" />
          </div>
        : `` 
      }

      { apiError ?
        <div className="api-error">Unfortunately, there's been an error trying to get any weather data</div>
        : ``
      }

      </div>
    </div>
  )
}
