@fptshop
@feature_filter
@allure.label.epic:FPT_Shop
@allure.label.severity:normal
@allure.label.owner:QA_Team
Feature: Product Filtering
  As a user
  I want to filter phones by technical specifications
  So that I can find a phone that meets my needs

  Scenario Outline: Filter by RAM and Storage
    Given I am on the FPT Shop phone page
    When I filter by "<filter_name>" with value "<value>"
    Then I should see the URL contains "<slug>"

    Examples:
      | filter_name | value   | slug     |
      | RAM         | 8 GB    | ram-8gb  |
      | ROM         | 256 GB  | rom-256gb|
