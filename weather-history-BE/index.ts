import express, { Request, Response } from 'express'
import cors from 'cors'
import axios, { AxiosError, AxiosResponse } from 'axios'

const app = express();
const port: number | string = process.env.PORT || 8080;

app.use(cors({
    credentials: true,
    origin: [
        'http://localhost:8080',
        'http://localhost:3000',
        'https://weather.visualcrossing.com'
    ]
}))

app.get('/', (req: Request, res: Response) => {
    const city: any = req.query.city
    const startDate: string  = `2022-08-10`
    const endDate: string = `2022-08-24`
    const apiUrl: string = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${city}/${startDate}/${endDate}?unitGroup=uk&key=ZG6RTP56DLKZJ8LWJCLVK4RM7&contentType=json`;

    function returnData(data: any): void {
        console.log(data)
        res.send(data)
    }

    (async () => {
        await axios(apiUrl)
            .then((response: AxiosResponse) => {
                returnData(response.data)
            })
            .catch((error: AxiosError) => console.log(`axios error: ${error.message}`))
    })()
})


// start server
app.listen( port, () => {
    console.log( `BE server started at http://localhost:${ port }` );
} );
