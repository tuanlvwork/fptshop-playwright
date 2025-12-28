@fptshop
@compare
@allure.label.epic:FPT_Shop
@allure.label.severity:normal
@allure.label.owner:QA_Team
Feature: Product Comparison
  As a user
  I want to compare two products
  So that I can decide which one to buy

  Scenario: Compare two products
    Given I am on the FPT Shop phone page
    When I add the first product to compare
    And I add the second product to compare
    Then I should see the comparison badge count is 2
