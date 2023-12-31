package kilowatt

import (
	"github.com/rickb777/date/v2"
	"github.com/rickb777/date/v2/timespan"
)

// KiloWattHourDayPrice is the price of the KiloWattHour for EDF (day).
const KiloWattHourFullHoursPrice float64 = 0.1841

// KiloWattHourNightPrice is the price of the KiloWattHour for EDF (night).
const KiloWattHourOffPeakPrice float64 = 0.1470

var KiloWattHourFullHoursPriceEvolution = map[timespan.DateRange]float64{
	timespan.BetweenDates(date.New(2000, 1, 1), date.New(2023, 7, 31)): 0.1841,
	timespan.BetweenDates(date.New(2023, 8, 1), date.New(2025, 8, 1)):  0.1828,
}

var KiloWattHourOffPeakPriceEvolution = map[timespan.DateRange]float64{
	timespan.BetweenDates(date.New(2000, 1, 1), date.New(2023, 7, 31)): 0.1470,
	timespan.BetweenDates(date.New(2023, 8, 1), date.New(2025, 8, 1)):  0.246,
}
