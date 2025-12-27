export const USERS = {
    standard: {
        username: 'standard_user',
        password: 'secret_sauce',
        description: 'Normal user with full access'
    },
    locked_out: {
        username: 'locked_out_user',
        password: 'secret_sauce',
        description: 'User that is locked out and cannot login'
    },
    problem: {
        username: 'problem_user',
        password: 'secret_sauce',
        description: 'User that experiences UI/UX problems'
    },
    performance: {
        username: 'performance_glitch_user',
        password: 'secret_sauce',
        description: 'User that experiences slow performance'
    },
    error: {
        username: 'error_user',
        password: 'secret_sauce',
        description: 'User that encounters errors during checkout'
    },
    visual: {
        username: 'visual_user',
        password: 'secret_sauce',
        description: 'User that sees visual/UI bugs'
    },
};

export type UserRole = keyof typeof USERS;
