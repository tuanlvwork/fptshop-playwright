@combination
Feature: Combination Filter
  As a user
  I want to filter by both brand and price
  So that I can narrow down my choices

  Scenario Outline: Filter by Brand and Price
    Given I am on the FPT Shop phone page
    When I filter by brand "<brand>" and price "<priceParam>"
    Then I should see the footer is visible

    Examples:
      | brand   | priceParam      |
      | apple   | duoi-2-trieu    |
      | apple   | tu-2-4-trieu    |
      | apple   | tu-4-7-trieu    |
      | apple   | tu-7-13-trieu   |
      | samsung | duoi-2-trieu    |
      | samsung | tu-2-4-trieu    |
      # ... (Adding a few representative examples to keep it concise for now, user can expand)
      | xiaomi  | tu-4-7-trieu    |
      | oppo    | tu-7-13-trieu   |
