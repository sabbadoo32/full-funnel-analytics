const mongoose = require('mongoose');
const BaseConnector = require('./BaseConnector');
const {
  getFacebookMetrics,
  getInstagramMetrics,
  getVideoMetrics,
  getPostMetrics,
  calculateVideoPerformanceScore,
  calculatePostPerformanceScore,
  getPerformanceTier
} = require('../helpers/socialAnalytics');

// Constants for performance tiers
const PERFORMANCE_TIERS = {
  EXCELLENT: { minScore: 80, label: 'Excellent' },
  GOOD: { minScore: 60, label: 'Good' },
  AVERAGE: { minScore: 40, label: 'Average' },
  NEEDS_IMPROVEMENT: { minScore: 0, label: 'Needs Improvement' }
};

class SocialConnector extends BaseConnector {
    constructor() {
        super();
        this.collection = 'full_funnel';
        this.requiredFields = [
            'Post ID', 'Page ID', 'Page name', 'Title', 'Description',
            'Post type', 'Publish time', 'Reactions', 'Comments', 'Shares',
            'Reach', 'Impressions', 'Engagement', 'Video Views'
        ];
    }

    /**
     * Query social media data
     * @param {Object} filters - Filters for the query
     * @returns {Promise<Array>} - Array of social media posts
     */
    async query(filters = {}) {
        try {
            const query = { 
                ...filters,
                'Post ID': { $exists: true, $ne: null },
                'Post type': { $exists: true, $ne: null }
            };

            const Campaign = mongoose.model('Campaign');
            return await Campaign.find(query)
                .select(this.requiredFields.join(' '))
                .lean()
                .exec();
        } catch (error) {
            console.error('Error querying social data:', error);
            throw new Error('Failed to fetch social media data');
        }
    }

    /**
     * Get social media metrics
     * @param {Object} query - Query parameters
     * @returns {Promise<Object>} - Social media metrics
     */
    async getMetrics(query = {}) {
        try {
            const posts = await this.query(query);
            
            if (!posts?.length) {
                return this.formatEmptyResponse();
            }

            // Process each post with enhanced metrics
            const processedPosts = posts.map(post => {
                try {
                    const platform = this.detectPlatform(post);
                    const isVideo = this.isVideoPost(post);
                    
                    // Get platform-specific metrics
                    const platformMetrics = platform === 'instagram' 
                        ? getInstagramMetrics(post) 
                        : getFacebookMetrics(post);
                    
                    // Get video metrics if applicable
                    const videoMetrics = isVideo ? getVideoMetrics(post) : null;
                    
                    // Get post metrics
                    const postMetrics = getPostMetrics(post);
                    
                    // Calculate performance score
                    const performanceScore = this.calculatePostPerformanceScore(post, platform, platformMetrics, videoMetrics);
                    const performanceTier = getPerformanceTier(performanceScore);
                    
                    return {
                        ...post,
                        platform,
                        isVideo,
                        metrics: {
                            ...platformMetrics,
                            ...(videoMetrics && { video: videoMetrics }),
                            ...postMetrics,
                            performance: {
                                score: performanceScore,
                                tier: performanceTier,
                                timestamp: new Date().toISOString()
                            }
                        },
                        timestamp: new Date().toISOString()
                    };
                } catch (error) {
                    console.error('Error processing post:', post['Post ID'], error);
                    return null;
                }
            }).filter(Boolean); // Remove any failed posts

            if (processedPosts.length === 0) {
                throw new Error('No valid posts found after processing');
            }

            // Calculate aggregate metrics
            const aggregateMetrics = this.calculateAggregateMetrics(processedPosts);
            
            // Generate insights and recommendations
            const insights = this.generateInsights(processedPosts, aggregateMetrics);
            const suggestions = this.generateSuggestions(aggregateMetrics);

            return this.formatResponse({
                success: true,
                total: processedPosts.length,
                platformBreakdown: this.breakdownByPlatform(processedPosts),
                postTypeBreakdown: this.breakdownByPostType(processedPosts),
                metrics: {
                    ...aggregateMetrics,
                    performance: {
                        overallScore: this.calculateOverallPerformanceScore(processedPosts),
                        tier: getPerformanceTier(this.calculateOverallPerformanceScore(processedPosts)),
                        distribution: this.calculatePerformanceDistribution(processedPosts)
                    },
                    insights,
                    suggestions,
                    timestamp: new Date().toISOString()
                },
                posts: processedPosts
            });
        } catch (error) {
            console.error('Error in SocialConnector.getMetrics:', error);
            return {
                success: false,
                error: error.message || 'Failed to process social media metrics',
                timestamp: new Date().toISOString()
            };
        }
            typeMetrics.avgReactions = typeMetrics.totalReactions / typeMetrics.count;
            typeMetrics.avgComments = typeMetrics.totalComments / typeMetrics.count;
            typeMetrics.avgShares = typeMetrics.totalShares / typeMetrics.count;
            typeMetrics.engagementRate = typeMetrics.totalReach > 0 ? 
                (typeMetrics.totalEngagement / typeMetrics.totalReach) * 100 : 0;
        });

        return {
            total: metrics.totalPosts,
            metrics
        };
    }

    /**
     * Format response for API
     * @param {Object} data - Raw data to format
     * @returns {Object} - Formatted response
     */
    formatResponse(data) {
        if (!data.success) {
            return {
                success: false,
                error: data.error,
                timestamp: data.timestamp || new Date().toISOString()
            };
        }

        const metrics = data.metrics || {};
        const performance = metrics.performance || {};
        
        return {
            success: true,
            type: 'social',
            total: data.total,
            metrics: {
                overview: {
                    totalPosts: metrics.totalPosts || 0,
                    totalReach: metrics.totalReach || 0,
                    totalEngagement: metrics.totalEngagement || 0,
                    averageEngagementRate: metrics.averageEngagementRate || 0,
                    averageVideoCompletionRate: metrics.averageVideoCompletionRate || 0,
                    performanceScore: performance.overallScore || 0,
                    performanceTier: performance.tier || 'Needs Improvement',
                    benchmarkComparison: this.calculateBenchmarkComparison(metrics)
                },
                performance: {
                    ...performance,
                    tier: performance.tier || 'Needs Improvement',
                    distribution: performance.distribution || {}
                },
                breakdowns: {
                    byPlatform: data.platformBreakdown || {},
                    byPostType: data.postTypeBreakdown || {},
                    byPerformanceTier: performance.distribution || {}
                },
                insights: metrics.insights || [],
                suggestions: metrics.suggestions || [],
                timestamps: {
                    dataStart: this.getEarliestPostDate(data.posts),
                    dataEnd: this.getLatestPostDate(data.posts),
                    processedAt: new Date().toISOString()
                }
            },
            _metadata: {
                version: '1.0.0',
                processedCount: data.posts?.length || 0,
                hasVideoContent: data.posts?.some(p => p.isVideo) || false
            }
        };
    }

    /**
     * Generate suggestions based on social metrics
     * @param {Object} metrics - Social metrics
     * @returns {Array} - List of suggestions
     */
    generateSuggestions(metrics) {
        const suggestions = [];

        if (metrics.avgEngagementRate < 1) {
            suggestions.push('Low engagement rate. Try posting more interactive content or asking questions to encourage engagement.');
        }

        if (metrics.avgCommentsPerPost < 3) {
            suggestions.push('Low comment rate. Try asking questions or creating content that encourages discussion.');
        }

        if (metrics.avgSharesPerPost < 1) {
            suggestions.push('Low share rate. Consider creating more shareable content like infographics or inspirational quotes.');
        }

        // Find best performing post type
        let bestPerformingType = '';
        let highestEngagement = 0;
        
        Object.entries(metrics.byType).forEach(([type, typeMetrics]) => {
            if (typeMetrics.engagementRate > highestEngagement) {
                highestEngagement = typeMetrics.engagementRate;
                bestPerformingType = type;
            }
        });

        if (bestPerformingType) {
            suggestions.push(`Your best performing post type is "${bestPerformingType}" with an engagement rate of ${highestEngagement.toFixed(2)}%. Consider creating more content like this.`);
        }

        return suggestions.length > 0 ? suggestions : ['Your social media performance looks good!'];
    }
}

    // Helper methods
    detectPlatform(post) {
        // Enhanced platform detection
        const platformSources = [
            { key: 'platform', value: post.platform },
            { key: 'Post ID', value: post['Post ID'] },
            { key: 'Page ID', value: post['Page ID'] },
            { key: 'source', value: post.source },
            { key: 'network', value: post.network }
        ];

        for (const { key, value } of platformSources) {
            if (!value) continue;
            
            const lowerValue = String(value).toLowerCase();
            if (lowerValue.includes('insta')) return 'instagram';
            if (lowerValue.includes('fb') || lowerValue.includes('facebook')) return 'facebook';
            if (lowerValue.includes('twitter')) return 'twitter';
            if (lowerValue.includes('linkedin')) return 'linkedin';
        }
        
        return 'facebook'; // Default fallback
    }

    isVideoPost(post) {
        return post['Post type']?.toLowerCase().includes('video') || 
               post['Media Type']?.toLowerCase() === 'video';
    }

    /**
     * Calculate post performance score
     */
    calculatePostPerformanceScore(post, platform, platformMetrics, videoMetrics) {
        if (platform === 'instagram') {
            return calculatePostPerformanceScore(
                platformMetrics.engagement?.rate || 0,
                this.isVideoPost(post),
                videoMetrics ? videoMetrics.performance?.score || 0 : 0,
                post['is_story'],
                post['story_metrics']
            );
        } else {
            return calculatePostPerformanceScore(
                platformMetrics.engagement?.rate || 0,
                this.isVideoPost(post),
                videoMetrics ? videoMetrics.performance?.score || 0 : 0,
                false,
                null
            );
        }
    }

    /**
     * Calculate overall performance score across all posts
     */
    calculateOverallPerformanceScore(posts) {
        if (!posts.length) return 0;
        const totalScore = posts.reduce((sum, post) => 
            sum + (post.metrics?.performance?.score || 0), 0);
        return Math.round((totalScore / posts.length) * 10) / 10; // Round to 1 decimal
    }

    /**
     * Calculate performance distribution by tier
     */
    calculatePerformanceDistribution(posts) {
        const distribution = {
            [PERFORMANCE_TIERS.EXCELLENT.label]: 0,
            [PERFORMANCE_TIERS.GOOD.label]: 0,
            [PERFORMANCE_TIERS.AVERAGE.label]: 0,
            [PERFORMANCE_TIERS.NEEDS_IMPROVEMENT.label]: 0
        };

        posts.forEach(post => {
            const tier = post.metrics?.performance?.tier || PERFORMANCE_TIERS.NEEDS_IMPROVEMENT.label;
            distribution[tier] = (distribution[tier] || 0) + 1;
        });

        // Convert to percentages
        const total = posts.length || 1;
        return Object.fromEntries(
            Object.entries(distribution).map(([tier, count]) => [
                tier,
                Math.round((count / total) * 100)
            ])
        );
    }

    /**
     * Calculate benchmark comparison metrics
     */
    calculateBenchmarkComparison(metrics) {
        const platform = metrics.platform || 'facebook';
        const benchmarks = BENCHMARKS[platform] || BENCHMARKS.facebook;
        
        return {
            engagementRate: {
                value: metrics.averageEngagementRate || 0,
                benchmark: benchmarks.engagementRate * 100, // Convert to percentage
                delta: metrics.averageEngagementRate ? 
                    (metrics.averageEngagementRate - (benchmarks.engagementRate * 100)) / (benchmarks.engagementRate * 100) * 100 : 0
            },
            videoCompletion: {
                value: metrics.averageVideoCompletionRate || 0,
                benchmark: benchmarks.videoCompletionRate * 100,
                delta: metrics.averageVideoCompletionRate ?
                    (metrics.averageVideoCompletionRate - (benchmarks.videoCompletionRate * 100)) / (benchmarks.videoCompletionRate * 100) * 100 : 0
            }
        };
    }

    /**
     * Get earliest post date from the dataset
     */
    getEarliestPostDate(posts) {
        if (!posts?.length) return null;
        return new Date(Math.min(...posts
            .map(p => new Date(p['Publish time'] || p['Created time'] || new Date()))
            .filter(d => !isNaN(d.getTime()))))
            .toISOString();
    }

    /**
     * Get latest post date from the dataset
     */
    getLatestPostDate(posts) {
        if (!posts?.length) return null;
        return new Date(Math.max(...posts
            .map(p => new Date(p['Publish time'] || p['Created time'] || new Date(0)))
            .filter(d => !isNaN(d.getTime()))))
            .toISOString();
    }

    /**
     * Calculate aggregate metrics from processed posts
     */
    calculateAggregateMetrics(posts) {
        if (!posts.length) return {};

        const totals = {
            reach: 0,
            impressions: 0,
            engagement: 0,
            reactions: 0,
            comments: 0,
            shares: 0,
            videoViews: 0,
            linkClicks: 0
        };

        // Calculate totals
        posts.forEach(post => {
            totals.reach += post.metrics.reach || 0;
            totals.impressions += post.metrics.impressions || 0;
            totals.engagement += post.metrics.engagementCount || 0;
            totals.reactions += post.metrics.reactions || 0;
            totals.comments += post.metrics.comments || 0;
            totals.shares += post.metrics.shares || 0;
            totals.videoViews += post.metrics.video?.views || 0;
            totals.linkClicks += post.metrics.linkClicks || 0;
        });

        // Calculate averages and rates
        const count = posts.length;
        return {
            totalPosts: count,
            averageReach: totals.reach / count,
            averageEngagementRate: totals.reach > 0 ? (totals.engagement / totals.reach) * 100 : 0,
            averageVideoCompletionRate: totals.videoViews > 0 ? 
                (totals.videoViews / totals.impressions) * 100 : 0,
            totalMetrics: {
                ...totals,
                engagementRate: totals.reach > 0 ? (totals.engagement / totals.reach) * 100 : 0,
                videoViewRate: totals.impressions > 0 ? (totals.videoViews / totals.impressions) * 100 : 0,
                shareRate: totals.reach > 0 ? (totals.shares / totals.reach) * 100 : 0,
                commentRate: totals.reach > 0 ? (totals.comments / totals.reach) * 100 : 0
            },
            performanceScore: this.calculatePerformanceScore(posts)
        };
    }

    calculatePerformanceScore(posts) {
        if (!posts.length) return 0;
        
        const totalScore = posts.reduce((sum, post) => {
            return sum + (post.metrics.performanceScore || 0);
        }, 0);
        
        return Math.round((totalScore / posts.length) * 10) / 10; // Round to 1 decimal place
    }

    generateInsights(posts, aggregateMetrics) {
        if (!posts.length) return [];
        
        const insights = [];
        const topPosts = [...posts]
            .sort((a, b) => (b.metrics.performanceScore || 0) - (a.metrics.performanceScore || 0))
            .slice(0, 3);
        
        // Top performing posts
        if (topPosts.length > 0) {
            insights.push({
                type: 'top_performers',
                title: 'Top Performing Posts',
                description: `Top ${topPosts.length} posts by performance score`,
                data: topPosts.map(post => ({
                    id: post['Post ID'],
                    title: post['Title'] || 'Untitled Post',
                    platform: this.detectPlatform(post),
                    performanceScore: post.metrics.performanceScore,
                    engagementRate: post.metrics.engagementRate,
                    reach: post.metrics.reach
                }))
            });
        }

        // Platform performance
        const platformMetrics = this.breakdownByPlatform(posts);
        insights.push({
            type: 'platform_performance',
            title: 'Performance by Platform',
            description: 'Engagement metrics across different platforms',
            data: Object.entries(platformMetrics).map(([platform, metrics]) => ({
                platform,
                postCount: metrics.count,
                avgEngagementRate: metrics.avgEngagementRate,
                avgPerformanceScore: metrics.avgPerformanceScore
            }))
        });

        // Content type performance
        const postTypeMetrics = this.breakdownByPostType(posts);
        insights.push({
            type: 'content_type_performance',
            title: 'Performance by Content Type',
            description: 'How different types of content are performing',
            data: Object.entries(postTypeMetrics).map(([type, metrics]) => ({
                type,
                count: metrics.count,
                avgEngagementRate: metrics.avgEngagementRate,
                avgPerformanceScore: metrics.avgPerformanceScore
            }))
        });

        return insights;
    }

    breakdownByPlatform(posts) {
        const platforms = {};
        
        posts.forEach(post => {
            const platform = this.detectPlatform(post);
            if (!platforms[platform]) {
                platforms[platform] = {
                    count: 0,
                    totalEngagementRate: 0,
                    totalPerformanceScore: 0
                };
            }
            
            platforms[platform].count++;
            platforms[platform].totalEngagementRate += post.metrics.engagementRate || 0;
            platforms[platform].totalPerformanceScore += post.metrics.performanceScore || 0;
        });

        // Calculate averages
        Object.keys(platforms).forEach(platform => {
            platforms[platform].avgEngagementRate = 
                platforms[platform].totalEngagementRate / platforms[platform].count;
            platforms[platform].avgPerformanceScore = 
                platforms[platform].totalPerformanceScore / platforms[platform].count;
        });

        return platforms;
    }

    breakdownByPostType(posts) {
        const postTypes = {};
        
        posts.forEach(post => {
            const type = post['Post type'] || 'unknown';
            if (!postTypes[type]) {
                postTypes[type] = {
                    count: 0,
                    totalEngagementRate: 0,
                    totalPerformanceScore: 0
                };
            }
            
            postTypes[type].count++;
            postTypes[type].totalEngagementRate += post.metrics.engagementRate || 0;
            postTypes[type].totalPerformanceScore += post.metrics.performanceScore || 0;
        });

        // Calculate averages
        Object.keys(postTypes).forEach(type => {
            postTypes[type].avgEngagementRate = 
                postTypes[type].totalEngagementRate / postTypes[type].count;
            postTypes[type].avgPerformanceScore = 
                postTypes[type].totalPerformanceScore / postTypes[type].count;
        });

        return postTypes;
    }

    formatEmptyResponse() {
        return {
            success: true,
            total: 0,
            platformBreakdown: {},
            postTypeBreakdown: {},
            metrics: {
                totalPosts: 0,
                averageReach: 0,
                averageEngagementRate: 0,
                averageVideoCompletionRate: 0,
                totalMetrics: {
                    reach: 0,
                    impressions: 0,
                    engagement: 0,
                    reactions: 0,
                    comments: 0,
                    shares: 0,
                    videoViews: 0,
                    linkClicks: 0,
                    engagementRate: 0,
                    videoViewRate: 0,
                    shareRate: 0,
                    commentRate: 0
                },
                performanceScore: 0,
                insights: [],
                timestamp: new Date().toISOString()
            },
            posts: []
        };
    }
}

module.exports = SocialConnector;
