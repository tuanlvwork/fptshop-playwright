@price
@allure.label.epic:E-commerce
@allure.label.feature:Product_Filtering
@allure.label.story:Price_Filter
@allure.label.severity:critical
@allure.label.owner:QA_Team
Feature: Price Filter
  As a user
  I want to filter phones by price range
  So that I can find phones within my budget

  Scenario Outline: Filter by Price
    Given I am on the FPT Shop phone page
    When I filter by price range "<label>" with param "<urlParam>"
    Then I should see the URL contains "<urlParam>"
    And I should see the product list is visible

    Examples:
      | label           | urlParam        |
      | Dưới 2 triệu    | duoi-2-trieu    |
      | Từ 2 - 4 triệu  | tu-2-4-trieu    |
      | Từ 4 - 7 triệu  | tu-4-7-trieu    |
      | Từ 7 - 13 triệu | tu-7-13-trieu   |
      | Từ 13 - 20 triệu| tu-13-20-trieu  |
      | Trên 20 triệu   | tren-20-trieu   |

