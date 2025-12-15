@brand
Feature: Brand Filter
  As a user
  I want to filter phones by brand
  So that I can find phones from my favorite manufacturers

  Scenario Outline: Filter by Brand
    Given I am on the FPT Shop phone page
    When I filter by brand "<brand>" with slug "<slug>"
    Then I should see the URL contains "<slug>"
    And I should see the header contains "<brand>"

    Examples:
      | brand   | slug    |
      | Apple   | apple   |
      | Samsung | samsung |
      | Xiaomi  | xiaomi  |
      | OPPO    | oppo    |
      | Vivo    | vivo    |
      | Nokia   | nokia   |
      | Realme  | realme  |
      | Asus    | asus    |
      | Tecno   | tecno   |
      | Masstel | masstel |
