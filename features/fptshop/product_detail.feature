@fptshop
@detail
@allure.label.epic:FPT_Shop
@allure.label.severity:critical
@allure.label.owner:QA_Team
Feature: Product Details
  As a user
  I want to view product details
  So that I can see more information about a phone

  Scenario Outline: View Product Detail
    Given I am on the FPT Shop phone page
    When I click on product at index <index>
    Then I should see the product detail page

    Examples:
      | index |
      | 0     |
      | 1     |
      | 2     |
      | 3     |
      | 4     |
      | 5     |
      | 6     |
      | 7     |
      | 8     |
      | 9     |
      | 10    |
      | 11    |
      | 12    |
      | 13    |
      | 14    |
      | 15    |
      | 16    |
      | 17    |
      | 18    |
      | 19    |

