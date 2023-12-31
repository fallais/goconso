package base

import (
	"encoding/csv"
	"fmt"
	"io"
	"slices"
	"strconv"
	"strings"
	"time"

	"goconso/pkg/edf"
	"goconso/pkg/edf/subscriptions"
	"log"
)

// BaseAvailablePowers are the available powers.
var BaseAvailablePowers = []edf.Power{edf.Power3kVA, edf.Power6kVA, edf.Power9kVA, edf.Power12kVA, edf.Power15kVA, edf.Power18kVA}

//------------------------------------------------------------------------------
// Structure
//------------------------------------------------------------------------------

type baseSubscription struct {
	power             edf.Power
	subscriptionPrice float64
	kilowattPrice     float64
	index             int
}

//------------------------------------------------------------------------------
// Factory
//------------------------------------------------------------------------------

// New returns a new Base subscription.
func New(power edf.Power, index int) subscriptions.Subscription {
	if !slices.Contains(BaseAvailablePowers, power) {
		log.Fatalf("invalid power (%dkVA) for this option", power)
	}

	subscriptionPrice, kw, err := findSubcriptionPrice(power)
	if err != nil {
		log.Fatalf("error when finding the subscription price: %v", err)
	}

	return &baseSubscription{
		power:             power,
		subscriptionPrice: subscriptionPrice,
		index:             index,
		kilowattPrice:     kw,
	}
}

//------------------------------------------------------------------------------
// Methods
//------------------------------------------------------------------------------

func (s *baseSubscription) Name() string {
	return "Base"
}

func (s *baseSubscription) SubscriptionPrice() float64 {
	return s.subscriptionPrice
}

func (s *baseSubscription) KiloWattHourPrice() float64 {
	return s.kilowattPrice
}

func (s *baseSubscription) CalculateSummary() *subscriptions.Summary {
	return &subscriptions.Summary{
		Index:        s.index,
		Subscription: s.subscriptionPrice,
		Consommation: float64(s.index) * s.kilowattPrice,
		Total:        float64(s.index)*s.kilowattPrice + s.subscriptionPrice,
	}
}

func findSubcriptionPrice(power edf.Power) (float64, float64, error) {
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

			kw, err := strconv.ParseFloat(strings.Replace(record[6], ",", ".", -1), 64)
			if err != nil {
				log.Fatal(err)
			}

			return s, kw, nil
		}

		if !endDate.IsZero() && time.Now().After(startDate) && time.Now().Before(endDate) && record[2] == strconv.Itoa(int(power)) {
			s, err := strconv.ParseFloat(strings.Replace(record[4], ",", ".", -1), 64)
			if err != nil {
				log.Fatal(err)
			}

			kw, err := strconv.ParseFloat(strings.Replace(record[6], ",", ".", -1), 64)
			if err != nil {
				log.Fatal(err)
			}

			return s, kw, nil
		}
	}

	return 0, 0, fmt.Errorf("not found")
}
