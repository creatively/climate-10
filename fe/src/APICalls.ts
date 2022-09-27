import { SetStateAction, useEffect } from 'react'
import { useStore } from './weather-history-store'
import { DateTime } from 'luxon'
import { Year, Years, YearsState } from './interfaces'
import axios, { AxiosError, AxiosPromise, AxiosResponse } from 'axios'
import { CatchClause } from 'typescript'
import { url } from 'inspector'
import dotenv from 'dotenv'


export default function APICalls(
        address: string, 
        yearsAgoStart: number,
        oldYearAgoStart: number,
        numberOfPastYears: number,  
        addYear: any, 
        addOldYear: any,
        setApiErrorMessage: any,
        weatherParameter: string
    ): void  {

    const currentYear = DateTime.now().year
    const apiUrls: string[] = []
    const apiOldUrls: string[] = []
    dotenv.config()


    // when this component begins, construct 'apiUrls' - a url to get data for each 'new' (2017-2021) year
    for (let index=yearsAgoStart; index<(numberOfPastYears + yearsAgoStart); index++) {
        const year: number = currentYear - index - 1
        const startYYYYMMDD: string = `${year}-01-01`
        const endYYYYMMDD: string = `${year}-12-31`
        const apiUrl: string = encodeURI(`${process.env.BACKEND_DOMAIN}/history?year=${year}&address=${address}&startDate=${startYYYYMMDD}&endDate=${endYYYYMMDD}`)
        apiUrls.push(apiUrl)
    }

    // when this component begins, construct 'apiOldUrls' - a url to get data for each 'old' (2007-2011) year
    for (let index=oldYearAgoStart; index<(numberOfPastYears + oldYearAgoStart); index++) {
        const year: number = currentYear - index - 1
        const startYYYYMMDD: string = `${year}-01-01`
        const endYYYYMMDD: string = `${year}-12-31`
        const apiUrl = encodeURI(`${process.env.BACKEND_DOMAIN}/history?year=${year}&address=${address}&startDate=${startYYYYMMDD}&endDate=${endYYYYMMDD}`)
        apiOldUrls.push(apiUrl)
    }

    // when this function is called, call the API for all historical weather data required
    function callAPI() {     

        function sendUrls(urls: string[], callbackAddYear: any) {
            try {
                Promise.all(
                    urls.map((url: any) => {
                        return axios.get(url)
                    })
                ).then((datas) => {
                    datas.forEach((data, index) => {
                        setTimeout(() => {
                            callbackAddYear(
                                Number(getYearFromData(data.data)),
                                getTemperaturesFromData(data.data)
                            )
                        }, index * (1000 + Math.random()*1000))
                    })
                    
                }).catch(handleError)
            } catch(e: any) {
                console.log(e)
                throw new Error('there was an error trying to process the climate data')
            }
        }

        sendUrls(apiUrls, addYear)
        setTimeout(() => {
            sendUrls(apiOldUrls, addOldYear)
        }, 9000)
    }

    // when passing a year's data is passed into this function, return what year the data represents
    function getYearFromData(data: any) {
        const year = Number(data.days[0].datetime.substring(0,4))
        return year
    }

    // when a year's data is passed into this function, return jusr an array of numbers of temprature values
    function getTemperaturesFromData(data: any) {
        const temperatues = data.days.map((day: any) => day[weatherParameter])
        return temperatues
    }

    // when this component begins, call the API
    callAPI()

    // when calling the API, if an error occurs, handle it
    function handleError(error: any) {
        const responseCode: number = error.response?.status || 200
        const errorMessage: string = error.message || ''
        let userMessage: string = ``

        if (responseCode === 422) {
            userMessage = `the past weather data for ${address} isn't available, please try another location`
        } else if (errorMessage === 'Network Error') {
            userMessage = `sorry, there was a network error trying to get you the information`
        } else if (errorMessage.length > 0) {
            console.log(error.message)
            userMessage = `sorry, there was an error getting you the information`
        } else {
            userMessage = `sorry, there was an error getting you the information`
        }
        
        setApiErrorMessage(userMessage)
    }
}
