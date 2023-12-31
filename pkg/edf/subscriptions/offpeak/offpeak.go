package offpeak

import (
	"encoding/csv"
	"fmt"
	"goconso/pkg/edf"
	"goconso/pkg/edf/subscriptions"
	"io"
	"log"
	"slices"
	"strconv"
	"strings"
	"time"
)

// OffPeakHoursAvailablePowers are the available powers.
var OffPeakHoursAvailablePowers = []edf.Power{edf.Power6kVA, edf.Power9kVA, edf.Power12kVA, edf.Power15kVA, edf.Power18kVA}

//------------------------------------------------------------------------------
// Structure
//------------------------------------------------------------------------------

type offpeakSubscription struct {
	power                      edf.Power
	kiloWattHourOffPeakPrice   float64
	kiloWattHourFullHoursPrice float64
	subscriptionPrice          float64
	indexHC                    int
	indexHP                    int
}

//------------------------------------------------------------------------------
// Factory
//------------------------------------------------------------------------------

// New returns a new Base subscription.
func New(power edf.Power, indexHC, indexHP int) subscriptions.Subscription {
	if !slices.Contains(OffPeakHoursAvailablePowers, power) {
		log.Fatalf("invalid power (%dkVA) for this option", power)
	}

	subscriptionPrice, kwHC, kwHP, err := findSubcriptionPrice(power)
	if err != nil {
		log.Fatalf("error when finding the subscription price: %v", err)
	}

	return &offpeakSubscription{
		power:                      power,
		indexHC:                    indexHC,
		indexHP:                    indexHP,
		subscriptionPrice:          subscriptionPrice,
		kiloWattHourOffPeakPrice:   kwHC,
		kiloWattHourFullHoursPrice: kwHP,
	}
}

//------------------------------------------------------------------------------
// Methods
//------------------------------------------------------------------------------

func (s *offpeakSubscription) Name() string {
	return "Heures Pleines / Heures Creuses"
}

func (s *offpeakSubscription) KiloWattHourPrice() float64 {
	return s.kiloWattHourFullHoursPrice
}

func (s *offpeakSubscription) CalculateSummary() *subscriptions.Summary {
	return &subscriptions.Summary{
		IndexHC:      s.indexHC,
		PriceHC:      float64(s.indexHC) * s.kiloWattHourOffPeakPrice,
		IndexHP:      s.indexHP,
		PriceHP:      float64(s.indexHP) * s.kiloWattHourFullHoursPrice,
		Index:        s.indexHC + s.indexHP,
		Subscription: s.subscriptionPrice,
		Total:        float64(s.indexHC)*s.kiloWattHourOffPeakPrice + float64(s.indexHP)*s.kiloWattHourFullHoursPrice + s.subscriptionPrice,
	}
}

func findSubcriptionPrice(power edf.Power) (float64, float64, float64, error) {
	r := csv.NewReader(strings.NewReader(OffPeakOptionPriceEvolutionRaw))
	r.Comma = ';'

	// Skip the first line
	if _, err := r.Read(); err != nil {
		panic(err)
	}

	for {
		record, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Fatal(err)
		}

		startDate, err := time.Parse("02/01/2006", record[0])
		if err != nil {
			log.Fatal(err)
		}

		var endDate time.Time
		if record[1] != "" {
			ed, err := time.Parse("02/01/2006", record[1])
			if err != nil {
				log.Fatal(err)
			}

			endDate = ed
		}

		if endDate.IsZero() && time.Now().After(startDate) && record[2] == strconv.Itoa(int(power)) {
			s, err := strconv.ParseFloat(strings.Replace(record[4], ",", ".", -1), 64)
			if err != nil {
				log.Fatal(err)
			}

			hc, err := strconv.ParseFloat(strings.Replace(record[6], ",", ".", -1), 64)
			if err != nil {
				log.Fatal(err)
			}

			hp, err := strconv.ParseFloat(strings.Replace(record[8], ",", ".", -1), 64)
			if err != nil {
				log.Fatal(err)
			}

			return s, hc, hp, nil
		}

		if !endDate.IsZero() && time.Now().After(startDate) && time.Now().Before(endDate) && record[2] == strconv.Itoa(int(power)) {
			s, err := strconv.ParseFloat(strings.Replace(record[4], ",", ".", -1), 64)
			if err != nil {
				log.Fatal(err)
			}

			hc, err := strconv.ParseFloat(strings.Replace(record[6], ",", ".", -1), 64)
			if err != nil {
				log.Fatal(err)
			}

			hp, err := strconv.ParseFloat(strings.Replace(record[8], ",", ".", -1), 64)
			if err != nil {
				log.Fatal(err)
			}

			return s, hc, hp, nil
		}

	}

	return 0, 0, 0, fmt.Errorf("not found")
}
