package subscription

import "testing"

func TestPerYearSubscription(t *testing.T) {
	_, err := PerYearSubscription(50, 50)
	if err == nil {
		t.Errorf("Should raise an error")
	}

	pys, err := PerYearSubscription(BaseOption, Power3kVA)
	if err != nil {
		t.Errorf("Should not raise an error")
	}
	if pys != 103.80000000000001 {
		t.Errorf("should be 1103.80000000000001 but is %v", pys)
	}
}
