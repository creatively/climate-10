import React, { useEffect, useState, useRef } from 'react';
import { useStore } from './weather-history-store'
import { VictoryChart, VictoryAxis, VictoryBar, VictoryTooltip, VictoryLabel, VictoryLine } from 'victory'
import { DateTime } from 'luxon'
import { Year, Years, YearsState } from './interfaces'
import APICalls from './APICalls'
import SearchBoxCustom from './SearchBoxCustom'
import './App.css'
import WebFont from 'webfontloader'


export default function App() {

  return (

    <div className="App">
      hi from App.tsx
    </div>
  )
}
