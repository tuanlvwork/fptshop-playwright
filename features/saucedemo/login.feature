@saucedemo @login
Feature: SauceDemo Login
  As a user of SauceDemo
  I want to login with different account types
  So that I can access the application based on my role

  Background:
    Given I am on the SauceDemo login page

  # ============================================
  # SUCCESSFUL LOGIN - Multiple Users
  # ============================================
  @smoke
  Scenario Outline: <user_type> user can login successfully
    When I login as "<role>"
    Then I should see the inventory page
    And I should see at least 1 product listed

    @standard
    Examples: Standard User
      | role     | user_type |
      | standard | Standard  |

    @problem
    Examples: Problem User
      | role    | user_type |
      | problem | Problem   |

    @performance
    Examples: Performance User
      | role        | user_type          |
      | performance | Performance glitch |

    @error
    Examples: Error User
      | role  | user_type |
      | error | Error     |

    @visual
    Examples: Visual User
      | role   | user_type |
      | visual | Visual    |

  # ============================================
  # FAILED LOGIN - Locked Out User
  # ============================================
  @locked_out @negative
  Scenario: Locked out user cannot login
    When I attempt to login as "locked_out"
    Then I should see the error message "Sorry, this user has been locked out"

  # ============================================
  # FAILED LOGIN - Invalid Credentials
  # ============================================
  @negative
  Scenario Outline: User cannot login with <scenario_name>
    When I attempt to login with username "<username>" and password "<password>"
    Then I should see the error message "<error_message>"

    @invalid-credentials
    Examples: Invalid Credentials
      | scenario_name       | username     | password       | error_message                      |
      | invalid credentials | invalid_user | wrong_password | Username and password do not match |

    @empty-username
    Examples: Empty Username
      | scenario_name  | username | password     | error_message        |
      | empty username |          | secret_sauce | Username is required |

    @empty-password
    Examples: Empty Password
      | scenario_name  | username      | password | error_message        |
      | empty password | standard_user |          | Password is required |
