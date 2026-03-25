-- ============================================================
-- EXAM PLATFORM - SEED DATA
-- ============================================================
-- Admin password: Admin@123 (bcrypt hash below)
-- bcrypt hash of "Admin@123" with 10 rounds

INSERT OR IGNORE INTO users (username, email, state, aspirant_type, password_hash, is_admin)
VALUES (
  'admin',
  'admin@clashofAIR.com',
  'Maharashtra',
  'Other',
  '$2y$10$JjzzFSOo0TZ27/Y/ViS4SO2sDk3gx7pmyzXdp6uoaQjCYcqwQm4RO',
  1
);

-- -- Sample student accounts (password: Student@123)
INSERT OR IGNORE INTO users (username, email, state, aspirant_type, password_hash, is_admin)
VALUES
  ('rahul_jee', 'rahul@example.com', 'Maharashtra', 'JEE-MAINS', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 0),
  ('priya_neet', 'priya@example.com', 'Tamil Nadu', 'NEET', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 0),
  ('aman_cet', 'aman@example.com', 'Delhi', 'MHT-CET', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 0);

-- Sample Events
INSERT OR IGNORE INTO events (title, exam_type, date, duration, question_count, is_visible, subjects_config, created_by)
VALUES
  ('JEE Main Mock Test - January Series', 'JEE-MAINS', datetime('now', '+2 days'), 180, 10, 1, '{"Physics": {"questions": 3, "positive_marks": 4, "negative_marks": 1}, "Chemistry": {"questions": 3, "positive_marks": 4, "negative_marks": 1}, "Maths": {"questions": 4, "positive_marks": 4, "negative_marks": 1}}', 1),
  ('NEET Grand Mock Test 2024', 'NEET', datetime('now', '+5 days'), 200, 10, 1, '{"Biology": {"questions": 4, "positive_marks": 4, "negative_marks": 1}, "Physics": {"questions": 3, "positive_marks": 4, "negative_marks": 1}, "Chemistry": {"questions": 3, "positive_marks": 4, "negative_marks": 1}}', 1),
  ('MHT-CET Practice Test Series 1', 'MHT-CET', datetime('now', '+7 days'), 90, 10, 1, '{"Physics": {"questions": 3, "positive_marks": 2, "negative_marks": 0}, "Chemistry": {"questions": 3, "positive_marks": 2, "negative_marks": 0}, "Maths": {"questions": 4, "positive_marks": 2, "negative_marks": 0}}', 1);

-- JEE Questions (Event 1)
INSERT OR IGNORE INTO questions (event_id, question_text, option_a, option_b, option_c, option_d, correct_answer, subject, explanation)
VALUES
  (1, 'A particle moves in a straight line with uniform acceleration. If it covers 10 m in the 1st second and 19 m in the 5th second, find the acceleration.', '2 m/s²', '3 m/s²', '4 m/s²', '5 m/s²', 'A', 'Physics', 'Using s_n = u + a(2n-1)/2. s1=u+a/2=10, s5=u+9a/2=19. Solving: 4a=9-a, 8a=8, a=2 m/s²'),
  (1, 'The dimensional formula for power is:', 'ML²T⁻²', 'ML²T⁻³', 'MLT⁻²', 'ML³T⁻³', 'B', 'Physics', 'Power = Work/Time = ML²T⁻²/T = ML²T⁻³'),
  (1, 'Which of the following is NOT a vector quantity?', 'Force', 'Velocity', 'Speed', 'Displacement', 'C', 'Physics', 'Speed is a scalar quantity. It has magnitude but no direction.'),
  (1, 'The atomic number of Carbon is:', '6', '8', '12', '14', 'A', 'Chemistry', 'Carbon has atomic number 6 and mass number 12.'),
  (1, 'Which law states that equal volumes of gases at same temperature and pressure contain equal number of molecules?', 'Boyle''s Law', 'Charles'' Law', 'Avogadro''s Law', 'Dalton''s Law', 'C', 'Chemistry', 'Avogadro''s Law: Equal volumes of ideal gases at the same temperature and pressure contain the same number of molecules.'),
  (1, 'The electronic configuration of Na (Z=11) is:', '2,8,1', '2,8,2', '2,9', '3,8', 'A', 'Chemistry', 'Na has 11 electrons: 2 in K shell, 8 in L shell, 1 in M shell = 2,8,1'),
  (1, 'If f(x) = x² + 2x + 1, find f''(x):', '2x + 2', '2x + 1', 'x + 2', '2x', 'A', 'Maths', 'Differentiating f(x) = x² + 2x + 1: f''(x) = 2x + 2'),
  (1, 'The value of sin(30°) + cos(60°) is:', '0', '1', '√2', '1/2', 'B', 'Maths', 'sin(30°) = 1/2 and cos(60°) = 1/2. Sum = 1/2 + 1/2 = 1'),
  (1, 'If the roots of x² - 5x + 6 = 0 are α and β, then α + β equals:', '5', '-5', '6', '-6', 'A', 'Maths', 'By Vieta''s formulas, sum of roots = -b/a = -(-5)/1 = 5'),
  (1, 'Newton''s second law of motion states that:', 'Every action has equal and opposite reaction', 'A body remains at rest unless acted upon', 'Force equals mass times acceleration', 'Momentum is conserved', 'C', 'Physics', 'F = ma is Newton''s second law. Force = Mass × Acceleration');

-- NEET Questions (Event 2)
INSERT OR IGNORE INTO questions (event_id, question_text, option_a, option_b, option_c, option_d, correct_answer, subject, explanation)
VALUES
  (2, 'Which organelle is called the "powerhouse of the cell"?', 'Nucleus', 'Mitochondria', 'Ribosome', 'Golgi Body', 'B', 'Biology', 'Mitochondria produce ATP through cellular respiration, hence called the powerhouse of the cell.'),
  (2, 'The process by which plants make food using sunlight is called:', 'Respiration', 'Transpiration', 'Photosynthesis', 'Digestion', 'C', 'Biology', 'Photosynthesis is the process where plants convert light energy, CO2 and water into glucose.'),
  (2, 'DNA stands for:', 'Deoxyribose Nucleic Acid', 'Deoxyribonucleic Acid', 'Diribonucleic Acid', 'Dinucleoprotein Acid', 'B', 'Biology', 'DNA = Deoxyribonucleic Acid, the genetic material in most organisms.'),
  (2, 'Which blood group is known as the universal donor?', 'A', 'B', 'AB', 'O', 'D', 'Biology', 'Blood group O- is the universal donor as it has no A or B antigens.'),
  (2, 'The chemical formula of glucose is:', 'C6H12O6', 'C12H22O11', 'C2H5OH', 'CH4', 'A', 'Chemistry', 'Glucose is C6H12O6, a simple sugar (monosaccharide).'),
  (2, 'The atomic number of Oxygen is:', '6', '7', '8', '16', 'C', 'Chemistry', 'Oxygen has atomic number 8, meaning it has 8 protons.'),
  (2, 'Enzyme amylase is used to break down:', 'Proteins', 'Fats', 'Starch', 'Nucleic acids', 'C', 'Chemistry', 'Salivary amylase breaks down starch into maltose in the mouth.'),
  (2, 'Which part of the brain controls breathing and heart rate?', 'Cerebrum', 'Cerebellum', 'Medulla Oblongata', 'Hypothalamus', 'C', 'Physics', 'Medulla oblongata controls vital functions like breathing, heart rate, and blood pressure.'),
  (2, 'Which is NOT a part of the human digestive system?', 'Oesophagus', 'Bronchus', 'Duodenum', 'Jejunum', 'B', 'Biology', 'Bronchus is part of the respiratory system, not the digestive system.'),
  (2, 'The pH of normal blood is approximately:', '6.4', '7.4', '8.4', '5.4', 'B', 'Chemistry', 'Normal blood pH ranges from 7.35 to 7.45, maintained by buffer systems.');

-- MHT-CET Questions (Event 3)
INSERT OR IGNORE INTO questions (event_id, question_text, option_a, option_b, option_c, option_d, correct_answer, subject, explanation)
VALUES
  (3, 'The Maharashtra state capital is:', 'Pune', 'Nagpur', 'Mumbai', 'Nashik', 'C', 'General', 'Mumbai is the capital city of Maharashtra state.'),
  (3, 'Which is the largest district in Maharashtra by area?', 'Nashik', 'Ahmednagar', 'Pune', 'Aurangabad', 'B', 'General', 'Ahmednagar is the largest district in Maharashtra by geographical area.'),
  (3, 'The velocity of sound in air at 0°C is approximately:', '232 m/s', '332 m/s', '432 m/s', '532 m/s', 'B', 'Physics', 'Speed of sound in air at 0°C (273K) is approximately 331-332 m/s.'),
  (3, 'Which acid is found in vinegar?', 'Citric acid', 'Lactic acid', 'Acetic acid', 'Tartaric acid', 'C', 'Chemistry', 'Vinegar contains acetic acid (ethanoic acid) CH3COOH.'),
  (3, 'The derivative of tan(x) is:', 'sin²(x)', 'cos²(x)', 'sec²(x)', 'cot²(x)', 'C', 'Maths', 'd/dx(tan x) = sec²(x)'),
  (3, 'Who founded the Rashtriya Swayamsevak Sangh (RSS)?', 'B.R. Ambedkar', 'K.B. Hedgewar', 'M.S. Golwalkar', 'V.D. Savarkar', 'B', 'General', 'RSS was founded by Keshav Baliram Hedgewar on September 27, 1925.'),
  (3, 'The chemical formula of sodium hydroxide is:', 'NaOH', 'NaCl', 'Na2SO4', 'NaHCO3', 'A', 'Chemistry', 'Sodium hydroxide is NaOH, also known as caustic soda.'),
  (3, 'Ohm''s law states that V is proportional to:', 'Resistance', 'Current', 'Power', 'Charge', 'B', 'Physics', 'Ohm''s law: V = IR, so voltage V is directly proportional to current I.'),
  (3, 'Which number comes next in: 2, 6, 12, 20, 30, ?', '40', '42', '44', '48', 'B', 'Maths', 'Pattern: differences are 4,6,8,10,12... So 30+12=42'),
  (3, 'The longest river in Maharashtra is:', 'Godavari', 'Krishna', 'Tapi', 'Bhima', 'A', 'General', 'The Godavari river is the longest river flowing through Maharashtra.');the longest river flowing through Maharashtra.');
