import { SetStateAction, useEffect } from 'react'
import { useStore } from './weather-history-store'
import { DateTime } from 'luxon'
import { Year, Years, YearsState } from './interfaces'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { CatchClause } from 'typescript'


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


    // RECENT YEARS
    for (let index=yearsAgoStart; index<(numberOfPastYears + yearsAgoStart); index++) {
        const year: number = currentYear - index - 1
        const startYYYYMMDD: string = `${year}-01-01`
        const endYYYYMMDD: string = `${year}-12-31`
        // --- expect a bug here where startDate is between Dec 16 & Dec 31, as year overlap

        const apiUrl: string = encodeURI(`http://localhost:8080/history?year=${year}&address=${address}&startDate=${startYYYYMMDD}&endDate=${endYYYYMMDD}`)
        apiUrls.push(apiUrl)
    }

    // OLDER YEARS
    for (let index=oldYearAgoStart; index<(numberOfPastYears + oldYearAgoStart); index++) {
        const year: number = currentYear - index - 1
        const startYYYYMMDD: string = `${year}-01-01`
        const endYYYYMMDD: string = `${year}-12-31`
        const apiUrl = encodeURI(`http://localhost:8080/history?year=${year}&address=${address}&startDate=${startYYYYMMDD}&endDate=${endYYYYMMDD}`)
        apiOldUrls.push(apiUrl)
    }

    function callAPI() {
        apiUrls.forEach((url) => {
    console.log(`--- new url REQUESTED ---->> : ${url}`)
            axios.get((url))
                .then((response: AxiosResponse) => {
                    const { data } = response
    console.log(`--- new url RESPONDED <<---- : ${url}`)

                    try {
                        addYear(
                            Number(getYearFromData(data)),
                            getTemperaturesFromData(data)
                        )
                    } catch(e: any) {
                        console.log(e)
                        throw new Error('there was an error trying to process the climate data')
                    }
                })
                .catch(handleError)
        })

        apiOldUrls.forEach((url) => {
    console.log(`--- old url REQUESTED ---->> : ${url}`)
            axios.get((url))
                .then((response: AxiosResponse) => {
                    const { data } = response
    console.log(`--- old url RESPONDED <<---- : ${url}`)

                    try {
                        addOldYear(
                            Number(getYearFromData(data)),
                            getTemperaturesFromData(data)
                        )
                    } catch(e: any) {
                        console.log(e)
                        throw new Error('there was an error trying to process the climate data')
                    }
                })
                .catch(handleError)
        })
    }

    function getYearFromData(data: any) {
        const year = Number(data.days[0].datetime.substring(0,4))
        return year
    }

    function getTemperaturesFromData(data: any) {
        const temperatues = data.days.map((day: any) => day[weatherParameter])
        return temperatues
    }

    callAPI()

    function handleError(error: any) {
        const responseCode: number = error.response?.status || 200
        const errorMessage: string = error.message || ''
        let userMessage: string = ``

        if (responseCode === 422) {
            userMessage = `the climate data for ${address} isn't available, please try another location`
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
