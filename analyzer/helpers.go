package analyzer

import (
	"fmt"

	"goconso/edf/subscription"
)

func parseOption(option string) (subscription.Option, error) {
	switch option {
	case "base":
		return subscription.BaseOption, nil
	case "hc_hp":
		return subscription.DayNightOption, nil
	default:
		return "", fmt.Errorf("unkown option")
	}
}
