package kilowatt

import (
	"github.com/rickb777/date/v2"
	"github.com/rickb777/date/v2/timespan"
)

// KiloWattHourPrice is the price of the KiloWattHour for EDF.
const KiloWattHourBasePrice float64 = 0.1740

var KiloWattHourBasePriceEvolution = map[timespan.DateRange]float64{
	timespan.BetweenDates(date.New(2023, 8, 1), date.New(2025, 8, 1)): 0.1740,
}
