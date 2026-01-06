/**
 * Script to generate sections and summary for an existing video
 * Usage: node generate-summary-for-video.js <video-id>
 */

// Load environment variables
require('dotenv').config();

const sectionDetectionService = require('./src/services/sectionDetectionService');
const summaryService = require('./src/services/summaryService');

async function generateSummaryForVideo(videoId) {
  console.log(`\n=== Generating Summary for Video: ${videoId} ===\n`);

  try {
    // Step 1: Detect sections
    console.log('Step 1: Detecting sections...');
    const sectionResult = await sectionDetectionService.detectSections(videoId);
    console.log(`✓ Sections detected: ${sectionResult.sections?.length || 0} sections`);

    if (sectionResult.sections && sectionResult.sections.length > 0) {
      // Step 2: Generate video summary
      console.log('\nStep 2: Generating video summary...');
      const summary = await summaryService.generateEnhancedVideoSummary(videoId);
      console.log('✓ Video summary generated successfully');
      console.log('\nSummary Details:');
      console.log(`- Full Summary: ${summary.full_summary?.substring(0, 100)}...`);
      console.log(`- Key Takeaways: ${summary.key_takeaways?.length || 0} items`);
      console.log(`- Topics: ${summary.topics?.length || 0} items`);
      console.log(`- Difficulty Level: ${summary.difficulty_level || 'N/A'}`);
      console.log(`- Target Audience: ${summary.target_audience?.substring(0, 80)}...`);
    } else {
      console.log('\n⚠ No sections detected, skipping summary generation');
    }

    console.log('\n=== Summary Generation Complete ===\n');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error generating summary:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Get video ID from command line argument
const videoId = process.argv[2];

if (!videoId) {
  console.error('Usage: node generate-summary-for-video.js <video-id>');
  process.exit(1);
}

// Run the script
generateSummaryForVideo(videoId);
