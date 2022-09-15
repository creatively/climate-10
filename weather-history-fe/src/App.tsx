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


export default function App() {

  const { years, addYear } = useStore()
  const { oldYears, addOldYear } = useStore()
  const { clearYears, clearOldYears } = useStore()

  const [ axisYmin, setAxisYmin ] = useState<number>(0)
  const [ axisYmax, setAxisYmax ] = useState<number>(0)
  const [ averagesAcrossYears, setAveragesAcrossYears ] = useState<number[]>([])
  const [ oldAveragesAcrossYears, setOldAveragesAcrossYears ] = useState<number[]>([])
  const [ plots, setPlots ] = useState<number[]>([])
  const [ plotsOld, setPlotsOld ] = useState<number[]>([])
  const [ yearsIncrease, setYearsIncrease] = useState<number>(0.00)
  const [ address, setAddress ] = useState<string>('')
  const [ apiErrorMessage, setApiErrorMessage ] = useState<string>('') 
  const [ showResultsText, setShowResultsText ] = useState<boolean>(false)
  const [ showGraph, setShowGraph ] = useState<boolean>(false)
  const [ showLoader, setShowLoader ] = useState<boolean>(false)
  const [ yearsWithDataReceived, setYearsWithDataReceived ] = useState<number[]>([])
  const [ oldYearsWithDataReceived, setOldYearsWithDataReceived ] = useState<number[]>([])
  const [ latestYearLoaded, setLatestYearLoaded ] = useState<number>(0)
  let [ opacity, setOpacity ] = useState(0.8);
  let [ shouldTransition, setShouldTransition ] = useState(true);

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


  // when this component forst loads, load the font
  useEffectOnce(() => {
    WebFont.load({google: {families: ['Monserrat','Volkhov']}});
  })

  // when CustomSearchBox has selected a location, clear up anything previous, and trigger API Calls
  function onSearchBoxUpdate(chosenCityDetails: ICityDetails) {
    setApiErrorMessage('')
    clearYears()
    clearOldYears()
    setYearsWithDataReceived([])
    setOldYearsWithDataReceived([])
    setShowGraph(false)
    setShowResultsText(false)
    setAddress(chosenCityDetails.label)
    setShowLoader(true)

    doApiCalls(chosenCityDetails.label)
  }


  // when an array is passed into this utility function, return an average of the numbers
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

  // when this function is called, calculate & set the graph's axis ranges 
  function setAxisMinMax() {

    // obtain the latest min/max values to size the graph axis
    const arrMax: number[] = years.map(year => Math.max(...year.temperatures))
    setAxisYmax(Math.max(...arrMax) + 3)

    const arrMin: number[] = years.map(year => Math.min(...year.temperatures))
    setAxisYmin(Math.min(...arrMin) - 3)
  }

  // when an array of 5 years X 365 day temperatures is passed into this function, return an array of average temperatures for 365 days
  function getEveryDaysAverageTemperature(yearsNewOrOld: Year[]): number[] {
    let dayAverages: number[] = []

    //  loop through days of year
    for (let daysIndex: number = 0; daysIndex < numberOfDaysToGet; daysIndex++) {
      let days: number[] = []

      // loop through years to average
      for (let yearsIndex = 0; yearsIndex < numberOfDaysToGet; yearsIndex++) {
        if (yearsNewOrOld[yearsIndex] && yearsNewOrOld[yearsIndex]?.temperatures[daysIndex]) {

          // build an array of temperature from each year for that day 
          days.push(yearsNewOrOld[yearsIndex].temperatures[daysIndex])
        }
      }

      // build an array of the average temperature for that day
      dayAverages.push(average(days))
    }
    return dayAverages
  }

  // when any year of 'years' data (2017-2021) is received, update the graph plots
  useEffect(() => {

    // add latest year data loaded to the list (yearsWithDataReceived) of such years
    const latestYear: number = years[years.length - 1]?.year

    //setYearsWithDataReceived([...yearsWithDataReceived, latestYear])
    setLatestYearLoaded(latestYear)
    setShouldTransition(false)
    setOpacity(0.8)

    // set the axis min/max scale
    setAxisMinMax()

    // get the average temperature for every day of the year
    const dayAverages: number[] = getEveryDaysAverageTemperature(years)

    // when the array of day values is ready (dayAverages), convert it to an array of broader averages across points in time (timepointAverages)
    const timepointAverages: number[] = getPlottableAveragesFromDayAverages(dayAverages)

    // when the array to plot is ready (timepointAverages), set 'plots'
    setPlots(timepointAverages)

  }, [ years ])


  // when any year of 'oldYears' data (2007-2011) is received, update the graph plots
  useEffect(() => {
      const latestYear: number = oldYears[oldYears.length - 1]?.year
      //setOldYearsWithDataReceived([...oldYearsWithDataReceived, latestYear])
      setLatestYearLoaded(latestYear)

      setShouldTransition(false)
      setOpacity(0.8)

      const dayAverages: number[] = getEveryDaysAverageTemperature(oldYears)
      const timepointAverages: number[] = getPlottableAveragesFromDayAverages(dayAverages)
      setPlotsOld(timepointAverages)
  }, [ oldYears ])

  // when the opacity of the background year texts changes, and not all year data loaded yet, fade the text out
  useEffect(() => {
    if (opacity === 0.8 && (yearsWithDataReceived.length < 5 || setOldYearsWithDataReceived.length < 5))  {
      setShouldTransition(true)
      setOpacity(0)
    }
  }, [ opacity ])


  // when day aveages have been calculated ('getEveryDaysAverageTemperature'), get timepoint/plottable averages from day averages
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
        
        // add timepont averages to results (plots)
        results.push(averageOfThisAndLastEntry)
        results.push(averageForTimepoint)
      }
    }

    // add the average for the new year period as the last timepoint
    results.push(averageForNewYear)
    results.push(averageForNewYear)

    return results
  }

  
  // when either years or oldYears changes, calculate & show the overall temperature change figure + the graph
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

    if (years.length > 0 || oldYears.length > 0) {
      setShowGraph(true)
      setShowLoader(false)
    }
    if (years.length === numberOfYearsToGet && oldYears.length === numberOfYearsToGet) {
      setShowResultsText(true)
    }

  }, [ years, oldYears])

  // when an API error occurs, hide any loader and graph
  useEffect(() => {
    if (apiErrorMessage !== '') {
      setShowLoader(false)
      setShowGraph(false)
    }
  }, [ apiErrorMessage ])

  // when this component initialises, call the API for data
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
        <header className="heading-container">
          <h2>Find how much your local climate has changed in 10 years</h2>
        </header>

        <section className="search-box-container">
          <SearchBoxCustom onSearchBoxUpdate={onSearchBoxUpdate} />

          { apiErrorMessage !== '' 
            ? <div className="api-error">{ apiErrorMessage }</div>
            : ``
          }
        </section>

        <section className="results-text-container">
          { showResultsText ?
              <div className="results-text">{ yearsIncrease >= 0 ? `+ `:``}{ yearsIncrease }'C in the last 10 years</div>
              : `` 
          }
        </section>

        { showGraph ? 

        <>

          <section className="key">
            <div className="key__old-years">2007 to 2011</div>
            <div className="key__new-years">2017 to 2021</div>
          </section>

          <section className="charts-container">

            { 
              latestYearLoaded > 0 &&  !showResultsText ?
                <div className="latest-year-loaded"
                  style={{
                    transition: shouldTransition ? "all 0.7s" : "",
                    opacity: `${opacity}`
                  }}
                >{ latestYearLoaded }</div>
              : 
                showResultsText ?
                  <div className="results-bg-text">{ yearsIncrease >= 0 ? `+`:``}{ yearsIncrease }'C</div>
              : 
                ``
            }

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
                        stroke: "rgba(200,200,200,0.2)",
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
                        stroke: "rgba(200,200,200,0.2)",
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
                  data={plotsOld}
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
          </section>

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
