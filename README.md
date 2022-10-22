This single webpage tool shows the temperature increase of the last 10 years for any user-chosen town/city

The user choses their town/city, and (via. a server-side proxy API) the code calls a 3rd party historical-weather data API. The town/cities are chosen from a custom auto-complete widget that calls a towns/cities API - this then coverts the city name into lat/lon co-ordinates that can then be used to call the weather data API.

The API's daily temperature data is compared betwween :
- each of the 1,826 days of 2007-2011, and
- each of the 1,826 days of 2017-2021

An overall figure is calculated, which shows how much the temperature has increased over 10 years for that particular town/city

A more detailed graph is also produced, showing [ months | temperature ] for each of the 2 time periods. This uses a smooth 20-day running-average line (plotted by Victory Charts) to indicate which times of the year have changed


Limitations / Future Improvements
- for common locations, data could be cached (server-side) to reduce API calls
- there are calculation bugs for many tropical locations. eg. Lagos in Nigeria, produces a (hopefully inaccurate) " + 3.2C " overall figure, but the graph shows that any visible increases between the plotted lines is very small across each month.
- for locations where average temperature never drops below about 15C, the 'months' axis sometimes isn't visible for some locations
- the autocomplete dropdown's content (cities listed) could be improved eg. there are some duplicate names returned from the 3rd party API that could be filtered out.
- As each year is received from the API, the UI (intentionally) quickly flashes the year (eg. "2019") over the dynamically loaded/plotting graph. This doesn't flash all of the 10 years. This is a minor UI improvement.
