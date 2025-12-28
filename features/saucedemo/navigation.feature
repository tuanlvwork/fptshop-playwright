@saucedemo @navigation
@allure.label.epic:Sauce_Demo
@allure.label.feature:Navigation
@allure.label.story:Menu_Navigation
@allure.label.severity:normal
@allure.label.owner:QA_Team
Feature: SauceDemo Navigation
  As a user of SauceDemo
  I want to navigate through the application
  So that I can access different sections easily

  # ============================================
  # SIDEBAR MENU - Navigation Options
  # ============================================
  @standard @menu @story:Menu
  Scenario: Standard user opens sidebar menu
    Given I am logged in as "standard"
    When I open the sidebar menu
    Then I should see the menu items

  @standard @menu-navigation
  Scenario Outline: Standard user navigates using <menu_option> menu
    Given I am logged in as "standard"
    When I open the sidebar menu
    And I click on "<menu_option>" menu option
    Then I should be on the "<expected_result>"

    @menu-all-items
    Examples: All Items Menu
      | menu_option | expected_result |
      | All Items   | inventory page  |

    @menu-about
    Examples: About Menu
      | menu_option | expected_result    |
      | About       | Sauce Labs website |

    @menu-logout
    Examples: Logout Menu
      | menu_option | expected_result |
      | Logout      | login page      |

  @standard @reset-state
  Scenario: Standard user resets app state via menu
    Given I am logged in as "standard"
    And I add the first item to the cart
    When I open the sidebar menu
    And I click on "Reset App State" menu option
    Then the cart badge should not be visible

  @standard @close-menu
  Scenario: Standard user closes sidebar menu
    Given I am logged in as "standard"
    When I open the sidebar menu
    And I close the sidebar menu
    Then the sidebar menu should not be visible

  # ============================================
  # NAVIGATION FROM DIFFERENT PAGES
  # ============================================
  @standard @cross-page-navigation
  Scenario Outline: Standard user navigates to inventory from <source_page>
    Given I am logged in as "standard"
    And I navigate to the <source_page>
    When I open the sidebar menu
    And I click on "All Items" menu option
    Then I should see the inventory page

    @from-cart
    Examples: From Cart Page
      | source_page |
      | cart page   |
