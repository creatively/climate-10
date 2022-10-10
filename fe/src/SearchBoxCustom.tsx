import React, { useEffect, useState, useRef } from 'react'
import { useDebounce } from 'use-debounce'
import './search-box-custom.css'
import axios, { AxiosError, AxiosResponse } from 'axios'


interface ICityDetails {
    label: string,
    lat: string,
    lon: string,
    flag: string,
    regionCode: string
}

interface IForecastProps {
    cityDetails: ICityDetails
}

interface ISearchBoxProps {
    onSearchBoxUpdate: (chosenCityDetails: ICityDetails) => void
}

const random = (): string => (Math.random() + 1).toString(36).substring(7)


export default function SearchBoxCustom({ onSearchBoxUpdate }: ISearchBoxProps) {

    // useStates
    const [ inputLetters, setInputLetters ] = useState<string>(``)
    const [ lettersReadyForCityApiCall ] = useDebounce(inputLetters, 1000)
    const [ citiesList, setCitiesList ] = useState<ICityDetails[]>([])
    const [ chosenCity, setChosenCity ] = useState<ICityDetails>()
    const [ optionsVisible, setOptionsVisible ] = useState<boolean>(false)
    const [ errorMessage, setErrorMessage ] = useState<string>(``)
    const [ errorLog, setErrorLog ] = useState<string>(``)
    const [ showApiCallLoaderImage, setShowApiCallLoaderImage ] = useState<boolean>(false)
    const [ showGreenTick, setShowGreenTick ] = useState<boolean>(false)
    let [ cityOptionWithFocus, setCityOptionWithFocus ] = useState(0)
    
    // useRefs
    const searchBoxRef = useRef<any>()
    const inputBoxRef = useRef<any>()
    const errorMessageElement = useRef<HTMLParagraphElement>(null)
    const cityOptionElementRefs = useRef<any[]>([
        React.createRef(), React.createRef(), React.createRef(), React.createRef(), React.createRef(), React.createRef(), React.createRef()
    ])

    // variables
    const thisDomain: string =  `${window.location.origin}` //`https://localhost:8080/`
    const maxNumberOfOptions = 7
    const imageIconLoader = 'https://media.giphy.com/media/sSgvbe1m3n93G/giphy.gif'
    const imageIconTick = `https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Yes_Check_Circle.svg/240px-Yes_Check_Circle.svg.png`
    const imageIconGlobe = `https://upload.wikimedia.org/wikipedia/commons/e/e4/Globe.png`


    // when this component mounts, focus on the inputbox
    useEffect(() => {
        inputBoxRef.current.focus()
    }, [])

    // when a user's keyboard navigates to a city, change it's highlight state 
    useEffect(() => {
        if (cityOptionElementRefs.current[cityOptionWithFocus].current) {
            cityOptionElementRefs.current[cityOptionWithFocus].current.style.backgroundColor='#f5f5f5'
        }
    }, [ cityOptionWithFocus ])

    // when 3+ letters of a city have been typed in inputbox, make an api call to autocomplete a list of cities
    useEffect(() => {
        if (lettersReadyForCityApiCall.length > 2) {
            const apiUrl: string = encodeURI(`${thisDomain}/cities-list?letters=${lettersReadyForCityApiCall}`);

            axios.get(apiUrl)
                .then((response: AxiosResponse ) => {
                    const cityDetails: ICityDetails[] = response.data
                    
                    return cityDetails.map((cityOption: any) => {
                        return {
                            label: cityOption.name,
                            lat: cityOption.latitude,
                            lon: cityOption.longitude,
                            flag: `https://countryflagsapi.com/png/${cityOption.countryCode}`,
                            regionCode: cityOption.regionCode
                        }
                    })
                })
                .then((citiesData: any) => {
                    setShowApiCallLoaderImage(false);
                    setOptionsVisible(true)
                    setCitiesList(citiesData)
                })
                .catch((error: AxiosError ) => {
                    console.log(error)
                    setErrorMessage(`Unfortunately, there's been a problem getting the list of cities`)
                    return []
                })
            }
    }, [ lettersReadyForCityApiCall ])

    // when an API call has got a city's latitude & longitude, then call the parent component's callback function
    useEffect(() => {
        if (chosenCity?.lat && chosenCity?.lon) {
            onSearchBoxUpdate(chosenCity)
        }
    }, [ chosenCity ])

    // if the error message variable is changed & and the text length > 0, then show the message
    useEffect(() => {
        if (errorMessage.length > 0) 
            errorMessageElement.current?.classList.add('error-message--show')
    }, [ errorMessage ])


    // when keys are pressed, act on any relevant keys
    function handleKeyPress(event: React.KeyboardEvent<HTMLElement>): void {
        const keyPressed = event.code

        const keyEventFunctions = {
            arrowUp: () => {
                if (cityOptionWithFocus > 0) setCityOptionWithFocus((cityOptionWithFocus) => cityOptionWithFocus-1)
            },
            arrowDown: () => {
                if (cityOptionWithFocus < maxNumberOfOptions-1) setCityOptionWithFocus((cityOptionWithFocus) => cityOptionWithFocus+1)
            },
            enter: () => {
                const keyboardSelectedCityObject = citiesList[cityOptionWithFocus]

                setChosenCity(keyboardSelectedCityObject)
                setInputLetters(keyboardSelectedCityObject.label)
                setOptionsVisible(false)
            },
            escape: () => {
                setOptionsVisible(false)
                searchBoxRef.current.blur()                
            },
            other: () => {}
        }

        keyPressed === 'ArrowUp'    ? keyEventFunctions.arrowUp() :
        keyPressed === 'ArrowDown'  ? keyEventFunctions.arrowDown() :
        keyPressed === 'Enter'      ? keyEventFunctions.enter() : 
        keyPressed === 'Escape'     ? keyEventFunctions.escape() : keyEventFunctions.other()
    }

    // when a city is selected, create and set it's city details object & update the UI
    function handleSetChosenCity(event: any): void {
        const liElement: HTMLLIElement = event.target.parentNode
        const chosenCity: ICityDetails = {
            label: liElement.querySelector('.label')?.textContent || ``,
            lat: liElement.getAttribute('data-lat') || ``,
            lon: liElement.getAttribute('data-lon') || ``,
            flag: liElement.querySelector('.flag')?.getAttribute('src') || ``,
            regionCode: liElement.querySelector('.regionCode')?.textContent || ``
        }
        setChosenCity(chosenCity)
        setInputLetters(chosenCity.label)
        setOptionsVisible(false)
    }

    // when typed letters fall below 5, then hide the autocomplete list
    function handleInputLettersChange(event: React.ChangeEvent<HTMLInputElement>): void {        
        setInputLetters(event.target.value)
        if (inputLetters.length < 5) {
            setOptionsVisible(false)
        }
    }


    // render the component
    return (
        <div className="search-box-custom" ref={searchBoxRef}>

            <input className="inputbox"
                title={'city searchbox'}
                ref={inputBoxRef} 
                value={inputLetters} 
                onChange={handleInputLettersChange} 
                onKeyDown={handleKeyPress} 
                placeholder={'your nearest city'}
            />

            <div className="inputbox-loader-container">
                {(showApiCallLoaderImage || showGreenTick)
                    ? <img className='inputbox-loader-image'
                        alt={
                            showApiCallLoaderImage
                                ? `loading city options` :
                            showGreenTick 
                                ? `city selected` : 
                            ``
                        }
                        height="100" width="24" 
                        src={
                            showApiCallLoaderImage
                                ? imageIconLoader :
                            showGreenTick 
                                ? imageIconTick : 
                            imageIconGlobe
                        }/>
                    :   <img className='inputbox-loader-image' alt='type here' height="24" width="24" src={imageIconGlobe} />
                }
            </div>

            <ul className={ optionsVisible && (chosenCity?.label !== inputLetters) ? "city-options--visible" : "city-options--hidden" }>
                {
                    citiesList.map((cityOption, index) => (
                        <li data-temp={`${index.toString()}`}
                            className={ 
                                (index === maxNumberOfOptions - 1) ? `city-option city-option--lastone` :
                                (index === maxNumberOfOptions - 2) ? `city-option city-option--lastbutone` : 
                                (index < maxNumberOfOptions - 2) ? `city-option`: ``
                            }
                            key={random()} 
                            ref={cityOptionElementRefs.current[index]}
                            data-lat={cityOption.lat} 
                            data-lon={cityOption.lon} 
                            onClick={handleSetChosenCity}
                        >
                            <img className='flag' alt='flag' src={cityOption.flag} />
                            <span className='label'>{cityOption.label}</span>
                            <span className='regionCode' title='region'>{cityOption.regionCode}</span>
                        </li>
                    ))
                }
            </ul>
            <p className="error-message" ref={errorMessageElement}>{errorMessage}</p>

        </div>
    )
}