import { useEffect } from 'react'
import { useStore } from './weather-history-store'
import { DateTime } from 'luxon'
import { Year, Years, YearsState } from './interfaces'
import axios, { AxiosError, AxiosResponse } from 'axios'


export default function APICalls(
        address: string, 
        yearsAgoStart: number,
        oldYearAgoStart: number,
        numberOfPastYears: number, 
        startMMDD: string, 
        endMMDD: string, 
        addYear: any, 
        addOldYear: any,
        weatherParameter: string
    ): void  {

    const currentYear = DateTime.now().year
    const apiUrls: string[] = []
    const apiOldUrls: string[] = []


    // RECENT YEARS
    for (let index=yearsAgoStart; index<(numberOfPastYears + yearsAgoStart); index++) {
        const year: number = currentYear - index - 1
        const startYYYYMMDD: string = `${year}-${startMMDD}`
        const endYYYYMMDD: string = `${year}-${endMMDD}`
        // --- expect a bug here where startDate is between Dec 16 & Dec 31, as year overlap

const apiUrl: string = `http://localhost:8080/history?year=${year}&address=London&startDate=${startYYYYMMDD}&endDate=${endYYYYMMDD}`

        apiUrls.push(apiUrl)
    }

    // OLDER YEARS
    for (let index=oldYearAgoStart; index<(numberOfPastYears + oldYearAgoStart); index++) {
        const year: number = currentYear - index - 1
        const startYYYYMMDD: string = `${year}-${startMMDD}`
        const endYYYYMMDD: string = `${year}-${endMMDD}`
        const apiUrl = `http://localhost:8080/history?year=${year}&address=London&startDate=${startYYYYMMDD}&endDate=${endYYYYMMDD}`
        apiOldUrls.push(apiUrl)
    }

    function callAPI() {
        apiUrls.forEach((url) => {
    console.log(`--- new url bring called : ${url}`)
            axios.get((url))
                .then((response: AxiosResponse) => {
                    const { data } = response
    console.log(`--- new url responded : ${url}`)
                    addYear(
                        Number(getYearFromData(data)),
                        getTemperaturesFromData(data)
                    )
                })
                .catch((error: AxiosError) => {
                    console.log(error.message)
                })
        })

        apiOldUrls.forEach((url) => {
    console.log(`--- old url bring called : ${url}`)
            axios.get((url))
                .then((response: AxiosResponse) => {
                    const { data } = response
    console.log(`--- old url responded : ${url}`)
                    addOldYear(
                        Number(getYearFromData(data)),
                        getTemperaturesFromData(data)
                    )
                })
                .catch((error: AxiosError) => {
                    console.log(error.message)
                })
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
}
