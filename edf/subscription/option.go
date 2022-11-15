package subscription

// Option is an EDF option.
type Option int

const (
	BaseOption Option = iota
	OffPeakHoursOption
	TempoOption
)

func (option Option) String() string {
	names := []string{
		"Base",
		"Heures Creuses",
		"Tempo",
	}

	if option < BaseOption || option > TempoOption {
		return "Unknown"
	}

	return names[option]
}
