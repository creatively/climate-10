import express, { Request, response, Response } from 'express'
import cors from 'cors'
import axios, { AxiosError, AxiosResponse } from 'axios'
import path from 'path'
import dotenv from 'dotenv'


const app = express();
dotenv.config()

interface ICityDetails {
    label: string,
    lat: string,
    lon: string,
    flag: string,
    regionCode: string
}


app.use(cors({
    credentials: true,
    origin: [
        'http://localhost:8080',
        'http://localhost:3000',
        'https://weather.visualcrossing.com',
        'https://geodb-free-service.wirefreethought.com/',
        'https://climate-10.herokuapp.com/',
        'https://climate-10.com/'
    ]
}))



app.get('/cities-list', (req: Request, res: Response) => {

    const letters = req.query.letters
    //const url: string = `${req.protocol}://geodb-free-service.wirefreethought.com/v1/geo/cities?minPopulation=100000&namePrefix=${letters}&hateoasMode=false&limit=7&offset=0&sort=name`;       

const url: string = `http://geodb-free-service.wirefreethought.com/v1/geo/cities?minPopulation=100000&namePrefix=London&hateoasMode=false&limit=7&offset=0&sort=name`

    console.log(`--- BE /cities-list/ called with letters : ${letters}`)
    console.log(`--- ${url}`);

    (async function(): Promise<void> {
        await axios.get(url)
            .then((response: AxiosResponse) => {
                const cityDetails: ICityDetails[] = response.data
                res.status(200).send(response.data.data)
            })
            .catch((error: AxiosError) => {
                console.log(`Unable to get list of cities from remote API`)
                res.status(500).send([])
            })
    })()
})


app.get('/history', (req: Request, res: Response) => {

    console.log(`--- /history/`)

    console.log(`--- BE called with : ${req.url}`)

    const lat: any = req.query.lat
    const lon: any = req.query.lon
    const startDate: any = req.query.startDate
    const endDate: any = req.query.endDate

    //const apiUrl: string = encodeURI(`${req.protocol}://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}/${startDate}/${endDate}?unitGroup=uk&elements=name%2C%2CresolvedAddress%2Ctemp%2CdatetimeEpoch&include=days%2Cobs&key=ZG6RTP56DLKZJ8LWJCLVK4RM7&contentType=json`)
    const apiUrl: string = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}/${startDate}/${endDate}?unitGroup=uk&elements=name%2Caddress%2CresolvedAddress%2Ctempmax%2Cdatetime&include=days%2Cobs&key=ZG6RTP56DLKZJ8LWJCLVK4RM7&options=preview&contentType=json`

    console.log(apiUrl)
    console.log(`--- ^-- : apiUrl = `);


    axios(apiUrl)
        .then((response: AxiosResponse) => {
            console.log(111111111)
            const data = response.data
            const days = data.days
            console.log(200)
            res.status(200).send(days)
        })
        .catch((error: AxiosError) => {
            console.log(2222222)
            const apisErrorMessage: any = error.response?.data
            if (apisErrorMessage?.includes(`Invalid location found`)) {
                console.log(`--- invalid location --- lat,lon = ${lat}, ${lon}`)
                res.status(422).send(`--- invalid location --- lat,lon = ${lat}, ${lon}`)
            } else {
                res.status(503).send(error)
            }
        })
})


app.use(express.static(path.join(__dirname, './fe/build')));
app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, './fe/build/index.html'))
})




// start server
const port: number | string = process.env.PORT || 8080;
app.listen( port, () => {
    console.log( `========= BE server started on port : ${ port } ========` );
} );
