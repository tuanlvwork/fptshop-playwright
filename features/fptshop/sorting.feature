@fptshop
@sorting
@allure.label.epic:E-commerce
@allure.label.feature:Product_Sorting
@allure.label.story:Sort_by_Criteria
@allure.label.severity:normal
@allure.label.owner:QA_Team
Feature: Product Sorting
  As a user
  I want to sort the product list
  So that I can see the products in my preferred order

  Scenario Outline: Sort products by <criteria>
    Given I am on the FPT Shop phone page
    When I sort items by "<criteria>"
    Then I should see the URL contains "<param>"

    Examples:
      | criteria      | param           |
      | Giá thấp - cao| sort=price-asc  |
      | Giá cao - thấp| sort=price-desc |
      | Bán chạy      | sort=selling    |
