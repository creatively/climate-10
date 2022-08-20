import { useStore } from './weather-history-store'
import { DateTime } from 'luxon'
import { Year, Years, YearsState } from './interfaces'
import axios, { AxiosError, AxiosResponse } from 'axios'


const c = (txt: string | number) => console.log(txt)


export default function APICalls(
        address: string, 
        yearsAgoStart: number,
        numberOfPastYears: number, 
        startMMDD: string, 
        endMMDD: string, 
        addYear: any, 
        weatherParameter: string
    ): void  {

    const currentYear = DateTime.now().year
    const apiUrls: string[] = []
    const apiOldUrls: string[] = []

    // NEWER YEARS
    
    for (let index=yearsAgoStart; index<(numberOfPastYears + yearsAgoStart); index++) {
        const year: number = currentYear - index - 1
        const startYYYYMMDD: string = `${year}-${startMMDD}`
        const endYYYYMMDD: string = `${year}-${endMMDD}`
        // --- expect a bug here where startDate is between Dec 16 & Dec 31, as year overlap
        
        const apiUrl = `http://localhost:8080/history?year=${year}&address=${address}&startDate=${startYYYYMMDD}&endDate=${endYYYYMMDD}`
        apiUrls.push(apiUrl)
    }

    apiUrls.forEach((url) => {
console.log(`url being called - ${url}`)
        axios.get((url))
            .then((response: AxiosResponse) => {
                const { data } = response
                addYear(
                    Number(getYearFromData(data)),
                    getTemperaturesFromData(data)
                )
            })
            .catch((error: AxiosError) => {
                console.log(error.message)
            })
    })


    // ---------- OLD YEARS ----------
    /*
    for (let index=0; index<numberOfPastYears; index++) {
        const year: number = currentYear - 50 - index - 1
        const startYYYYMMDD: string = `${year}-${startMMDD}`
        const endYYYYMMDD: string = `${year}-${endMMDD}`     
        const apiUrl = `http://localhost:8080/history?year=${year}&address=${address}&startDate=${startYYYYMMDD}&endDate=${endYYYYMMDD}`
        apiOldUrls.push(apiUrl)
    }

    apiOldUrls.forEach((url) => {
console.log(`--- apiUrls.each item = ${url}`)
        axios.get((url))
            .then((response: AxiosResponse) => {
                const { data } = response
                const _year: number = getYearFromData(data)
                const _temperatures = getTemperaturesFromData(data)
                addOldYear(
                    _year,
                    _temperatures
                )
console.log(`--- old year added : ${_year}`)
            })
            .catch((error: AxiosError) => {
                console.log(error.message)
            })
    })
    */

    function getYearFromData(data: any) {
        const year = Number(data.days[0].datetime.substring(0,4))
        return year
    }

    function getTemperaturesFromData(data: any) {
        const temperatues = data.days.map((day: any) => day[weatherParameter])
        return temperatues
    }
}
