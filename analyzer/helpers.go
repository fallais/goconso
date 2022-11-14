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

func parsePower(power int) (subscription.Power, error) {
	switch power {
	case 3:
		return subscription.Power3kVA, nil
	case 6:
		return subscription.Power6kVA, nil
	case 9:
		return subscription.Power9kVA, nil
	case 12:
		return subscription.Power12kVA, nil
	case 15:
		return subscription.Power15kVA, nil
	case 18:
		return subscription.Power18kVA, nil
	default:
		return 0, fmt.Errorf("unkown option")
	}
}
