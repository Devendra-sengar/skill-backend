// analysis.service.js
const Question = require('../models/question');

exports.generateAnalysis = async (participation) => {
  try {
    if (!participation.answers || participation.answers.length === 0) {
      return {
        message: 'No answers found to analyze'
      };
    }

    // Calculate basic metrics
    const totalQuestions = participation.answers.length;
    const correctAnswers = participation.answers.filter(a => a.isCorrect).length;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const accuracyRate = (correctAnswers / totalQuestions) * 100;
    
    // Calculate time metrics
    const totalTimeSpent = participation.answers.reduce((sum, answer) => sum + (answer.timeSpent || 0), 0);
    const avgTimePerQuestion = totalTimeSpent / totalQuestions;
    
    // Analyze questions by topic and difficulty
    const questionDetails = participation.answers.map(answer => {
      const question = answer.questionId;
      return {
        topicTags: question.topicTags,
        difficulty: question.difficulty,
        isCorrect: answer.isCorrect,
        timeSpent: answer.timeSpent
      };
    });
    
    // Topic analysis
    const topicPerformance = {};
    questionDetails.forEach(q => {
      q.topicTags.forEach(topic => {
        if (!topicPerformance[topic]) {
          topicPerformance[topic] = {
            total: 0,
            correct: 0,
            totalTime: 0
          };
        }
        
        topicPerformance[topic].total += 1;
        if (q.isCorrect) topicPerformance[topic].correct += 1;
        topicPerformance[topic].totalTime += q.timeSpent || 0;
      });
    });
    
    // Identify strengths and weaknesses
    const strengths = [];
    const weaknesses = [];
    
    Object.keys(topicPerformance).forEach(topic => {
      const performance = topicPerformance[topic];
      const topicAccuracy = (performance.correct / performance.total) * 100;
      const topicAvgTime = performance.totalTime / performance.total;
      
      // Define strength/weakness criteria
      if (topicAccuracy >= 70) {
        strengths.push(topic);
      } else if (topicAccuracy <= 40) {
        weaknesses.push(topic);
      }
      
      // You could also incorporate time into this analysis
      // E.g., if they're very slow on a topic even if accurate
    });
    
    // Difficulty analysis
    const difficultyPerformance = {
      easy: { total: 0, correct: 0, totalTime: 0 },
      medium: { total: 0, correct: 0, totalTime: 0 },
      hard: { total: 0, correct: 0, totalTime: 0 }
    };
    
    questionDetails.forEach(q => {
      const level = q.difficulty;
      difficultyPerformance[level].total += 1;
      if (q.isCorrect) difficultyPerformance[level].correct += 1;
      difficultyPerformance[level].totalTime += q.timeSpent || 0;
    });
    
    // Time management assessment
    let timeManagement = 'Good';
    if (avgTimePerQuestion > 90) { // Assuming 90 seconds is a threshold
      timeManagement = 'Needs improvement - too slow';
    } else if (totalTimeSpent < totalQuestions * 20) { // Assuming 20 seconds minimum per question
      timeManagement = 'Needs improvement - too rushed';
    }
    
    return {
      summary: {
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        accuracyRate: accuracyRate.toFixed(2) + '%',
        totalTimeSpent: formatTime(totalTimeSpent),
        avgTimePerQuestion: formatTime(avgTimePerQuestion)
      },
      strengths,
      weaknesses,
      topicPerformance,
      difficultyPerformance,
      timeManagement
    };
  } catch (error) {
    console.error('Error in analysis service:', error);
    throw error;
  }
};

// Helper function to format time in seconds to minutes:seconds
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}


