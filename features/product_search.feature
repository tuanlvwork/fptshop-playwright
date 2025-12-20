@search
@allure.label.epic:E-commerce
@allure.label.feature:Product_Search
@allure.label.story:Search_by_Product_Name
@allure.label.severity:blocker
@allure.label.owner:QA_Team
Feature: Product Search
  As a user
  I want to search for specific phones
  So that I can quickly find the product I am looking for

  Scenario Outline: Search for Product
    Given I am on the FPT Shop phone page
    When I search for product "<product>"
    Then I should see the product list is visible

    Examples:
      | product                  |
      | iPhone 15 Pro Max        |
      | Samsung Galaxy Z Fold5   |
      | Xiaomi 13T               |
      | OPPO Find N3 Flip        |
      | Vivo V29e                |
      | Realme 11                |
      | Nokia G22                |
      | Asus ROG Phone 7         |
      | Tecno Pova 5             |
      | Samsung Galaxy S23 Ultra |
      | iPhone 14                |
      | iPhone 13                |
      | Samsung Galaxy A54       |
      | Xiaomi Redmi Note 12     |
      | OPPO Reno10              |
      | Vivo Y36                 |
      | Realme C55               |
      | Nokia C32                |
      | Samsung Galaxy M34       |
      | iPhone 11                |

