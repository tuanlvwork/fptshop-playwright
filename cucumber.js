const common = {
    requireModule: ['ts-node/register', 'tsconfig-paths/register'],
    require: ['src/steps/*.ts', 'src/support/*.ts'],
};

module.exports = {
    default: {
        ...common,
        parallel: 4,
        format: [
            'progress-bar',
            'html:cucumber-report.html',
            'json:cucumber-report.json'
        ],
        paths: ['features/*.feature'],
    },
    shard: {
        ...common,
    }
}
