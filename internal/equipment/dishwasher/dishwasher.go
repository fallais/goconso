package dishwasher

import (
	"goconso/internal/equipment"
)

//------------------------------------------------------------------------------
// Structure
//------------------------------------------------------------------------------

// A dishwasher is an equipement that washes dishes.
type dishwasher struct {
	name           string
	operatingHours string
}

//------------------------------------------------------------------------------
// Factory
//------------------------------------------------------------------------------

// New returns a new Equipment.
func New() equipment.Equipment {
	return &dishwasher{
		name:           "Lave-vaiselle",
		operatingHours: "night",
	}
}

// NewWithOperatingHours returns a new Equipment with given operating hours.
func NewWithOperatingHours(operatingHours string) equipment.Equipment {
	return &dishwasher{
		name:           "Lave-vaiselle",
		operatingHours: operatingHours,
	}
}

//------------------------------------------------------------------------------
// Functions
//------------------------------------------------------------------------------

// Name return the name.
func (c *dishwasher) Name() string {
	return c.name
}

// OperatingHours returns the operating hours.
func (c *dishwasher) OperatingHours() string {
	return c.operatingHours
}
