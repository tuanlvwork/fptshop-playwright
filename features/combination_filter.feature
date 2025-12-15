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
      | apple   | tu-13-20-trieu  |
      | apple   | tren-20-trieu   |
      | samsung | duoi-2-trieu    |
      | samsung | tu-2-4-trieu    |
      | samsung | tu-4-7-trieu    |
      | samsung | tu-7-13-trieu   |
      | samsung | tu-13-20-trieu  |
      | samsung | tren-20-trieu   |
      | xiaomi  | duoi-2-trieu    |
      | xiaomi  | tu-2-4-trieu    |
      | xiaomi  | tu-4-7-trieu    |
      | xiaomi  | tu-7-13-trieu   |
      | xiaomi  | tu-13-20-trieu  |
      | xiaomi  | tren-20-trieu   |
      | oppo    | duoi-2-trieu    |
      | oppo    | tu-2-4-trieu    |
      | oppo    | tu-4-7-trieu    |
      | oppo    | tu-7-13-trieu   |
      | oppo    | tu-13-20-trieu  |
      | oppo    | tren-20-trieu   |
      | vivo    | duoi-2-trieu    |
      | vivo    | tu-2-4-trieu    |
      | vivo    | tu-4-7-trieu    |
      | vivo    | tu-7-13-trieu   |
      | vivo    | tu-13-20-trieu  |
      | vivo    | tren-20-trieu   |
      | nokia   | duoi-2-trieu    |
      | nokia   | tu-2-4-trieu    |
      | nokia   | tu-4-7-trieu    |
      | nokia   | tu-7-13-trieu   |
      | nokia   | tu-13-20-trieu  |
      | nokia   | tren-20-trieu   |
      | realme  | duoi-2-trieu    |
      | realme  | tu-2-4-trieu    |
      | realme  | tu-4-7-trieu    |
      | realme  | tu-7-13-trieu   |
      | realme  | tu-13-20-trieu  |
      | realme  | tren-20-trieu   |
      | asus    | duoi-2-trieu    |
      | asus    | tu-2-4-trieu    |
