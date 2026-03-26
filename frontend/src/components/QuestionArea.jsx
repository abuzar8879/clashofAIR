import React from 'react'

const OPTION_KEYS = ['A', 'B', 'C', 'D']
const OPTION_FIELDS = ['option_a', 'option_b', 'option_c', 'option_d']

export default function QuestionArea({ 
  question, 
  questionIndex, 
  totalQuestions, 
  selectedAnswer, 
  isMarked, 
  onSelect, 
  onNext, 
  onPrev, 
  onMarkReview, 
  onClearResponse,
  isFirst,
  isLast 
}) {
  if (!question) return null

  return (
    <div className="exam-question-area">
      <div className="question-header">
        <span className="question-number">
          Question {questionIndex + 1} of {totalQuestions}
        </span>
        {isMarked && (
          <span style={{
            background: 'var(--marked-bg)',
            color: 'var(--marked)',
            padding: '2px 8px',
            borderRadius: '3px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            <i className="fa-solid fa-bookmark"></i> Marked for Review
          </span>
        )}
      </div>

      <div className="question-text">
        {question.question_text}
      </div>

      <ul className="options-list">
        {OPTION_KEYS.map((key, i) => {
          const optionText = question[OPTION_FIELDS[i]]
          if (!optionText) return null
          const isSelected = selectedAnswer === optionText || selectedAnswer === key

          return (
            <li
              key={key}
              className={`option-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(question.id, optionText)}
            >
              <span className="option-key">{key}</span>
              <span className="option-text">{optionText}</span>
            </li>
          )
        })}
      </ul>

      <div className="question-actions">
        <button
          className="btn-secondary"
          onClick={onPrev}
          disabled={isFirst}
          style={{ minWidth: '90px' }}
        >
          <i className="fa-solid fa-arrow-left"></i> Previous
        </button>
        <button
          className="btn-secondary"
          onClick={onNext}
          disabled={isLast}
          style={{ minWidth: '90px' }}
        >
          Next <i className="fa-solid fa-arrow-right"></i>
        </button>
        <button
          onClick={() => onMarkReview(question.id)}
          style={{
            padding: '9px 14px',
            background: isMarked ? 'var(--marked)' : 'var(--marked-bg)',
            color: isMarked ? '#fff' : 'var(--marked)',
            border: `1px solid var(--marked)`,
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          <i className="fa-solid fa-bookmark"></i> {isMarked ? 'Unmark Review' : 'Mark for Review'}
        </button>
        <button
          className="btn-secondary"
          onClick={() => onClearResponse(question.id)}
          disabled={!selectedAnswer}
          style={{ fontSize: '13px' }}
        >
          Clear Response
        </button>
      </div>
    </div>
  )
}
