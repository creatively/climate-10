import express, { Request, Response } from 'express'
import cors from 'cors'
import axios, { AxiosError, AxiosResponse } from 'axios'
import path from 'path'
import dotenv from 'dotenv'

const app = express();
dotenv.config()


app.use(cors({
    credentials: true,
    origin: [
        'http://localhost:8080',
        'http://localhost:3000',
        'https://weather.visualcrossing.com'
    ]
}))



app.get('/history', (req: Request, res: Response) => {

    console.log(`--- BE called with : ${req.url}`)

    const address: any = req.query.address
    const startDate: any = req.query.startDate
    const endDate: any = req.query.endDate
    const apiUrl: string = encodeURI(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${address}/${startDate}/${endDate}?unitGroup=uk&key=ZG6RTP56DLKZJ8LWJCLVK4RM7&contentType=json`);

    console.log(`--- ^ apiUrl = ${apiUrl}`);

    (async () => {
        await axios(apiUrl)
            .then((response: AxiosResponse) => {
                res.status(200).send(response.data)
            })
            .catch((error: AxiosError) => {
                const apisErrorMessage: any = error.response?.data
                if (apisErrorMessage?.includes(`Invalid location found`)) {
                    console.log(`--- invalid location --- ${address}`)
                    res.status(422).send(`--- invalid location --- ${address}`)
                } else {
                    res.status(503).send(error)
                }
            })
    })()
})




app.use(express.static(path.join(__dirname, './fe/build')));
app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, './fe/build/index.html'))
})




// start server
const port: number | string = process.env.PORT || 8080;
app.listen( port, () => {
    console.log( `BE server started on port : ${ port }` );
} );
