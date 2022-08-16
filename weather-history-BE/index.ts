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

app.get('/history', (req: Request, res: Response) => {
console.log(req.url)

    const address: any = req.query.address
    const startDate: any = req.query.startDate
    const endDate: any = req.query.endDate
    const apiUrl: string = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${address}/${startDate}/${endDate}?unitGroup=uk&key=ZG6RTP56DLKZJ8LWJCLVK4RM7&contentType=json`;

    (async () => {
        console.log(`about to axios`)
        await axios(apiUrl)
            .then((response: AxiosResponse) => {
                res.send(response.data)
            })
            .catch((error: AxiosError) => console.log(`>>>>>> axios error: ${error.message}`))
    })()
})


// start server
app.listen( port, () => {
    console.log( `BE server started at http://localhost:${ port }` );
} );
