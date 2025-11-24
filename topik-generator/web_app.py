# web_app.py

from flask import Flask, render_template_string, jsonify, request, send_file
from flask_cors import CORS
import json
import os
from datetime import datetime
from topik_generator import TOPIKIIReadingGenerator, TOPIKQuestion
from database import TOPIKDatabase
from quality_control import QualityValidator
from formatter import TestFormatter

app = Flask(__name__)
CORS(app)

# 디렉토리 생성
os.makedirs('tests', exist_ok=True)
os.makedirs('generated', exist_ok=True)
os.makedirs('database', exist_ok=True)

# 전역 인스턴스
generator = TOPIKIIReadingGenerator()
db = TOPIKDatabase("database/topik.db")
validator = QualityValidator()
formatter = TestFormatter()

# 메인 페이지 템플릿
INDEX_TEMPLATE = """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TOPIK II 읽기 시험 생성기</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Malgun Gothic', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
        }

        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
        }

        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }

        .card {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .card h2 {
            color: #667eea;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e0e7ff;
        }

        .button-group {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }

        .btn {
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 1.1em;
            cursor: pointer;
            transition: all 0.3s;
            font-weight: bold;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
            background: #f0f0f0;
            color: #333;
        }

        .btn-secondary:hover {
            background: #e0e0e0;
        }

        .status {
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            display: none;
        }

        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .status.info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }

        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .test-list {
            list-style: none;
        }

        .test-item {
            padding: 15px;
            margin: 10px 0;
            background: #f8f9fa;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .test-item:hover {
            background: #e9ecef;
        }

        .test-info {
            flex-grow: 1;
        }

        .test-actions {
            display: flex;
            gap: 10px;
        }

        .btn-small {
            padding: 8px 15px;
            font-size: 0.9em;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }

        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }

        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }

        .stat-label {
            opacity: 0.9;
        }

        .options {
            margin: 20px 0;
        }

        .option-group {
            margin: 15px 0;
        }

        .option-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #555;
        }

        .option-group select,
        .option-group input {
            width: 100%;
            padding: 10px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 1em;
        }

        .option-group select:focus,
        .option-group input:focus {
            outline: none;
            border-color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 TOPIK II 읽기 시험 생성기</h1>
            <p>자동으로 TOPIK II 읽기 시험을 생성하고 관리합니다</p>
        </div>

        <!-- 생성 섹션 -->
        <div class="card">
            <h2>📝 새 시험 생성</h2>

            <div class="options">
                <div class="option-group">
                    <label>난이도</label>
                    <select id="difficulty">
                        <option value="easy">쉬움 (3-4급 위주)</option>
                        <option value="medium" selected>보통 (3-5급 균형)</option>
                        <option value="hard">어려움 (5-6급 위주)</option>
                    </select>
                </div>
            </div>

            <div class="button-group">
                <button class="btn btn-primary" onclick="generateTest()">
                    ✨ 시험 생성하기
                </button>
                <button class="btn btn-secondary" onclick="generateWithValidation()">
                    ✓ 생성 + 품질 검증
                </button>
            </div>

            <div id="generateStatus" class="status"></div>
            <div id="loading" class="loading">
                <div class="spinner"></div>
                <p>시험을 생성하는 중...</p>
            </div>
        </div>

        <!-- 통계 섹션 -->
        <div class="card">
            <h2>📊 시스템 통계</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">생성된 시험</div>
                    <div class="stat-number" id="totalTests">0</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">전체 문제</div>
                    <div class="stat-number" id="totalQuestions">0</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">응시 횟수</div>
                    <div class="stat-number" id="totalAttempts">0</div>
                </div>
            </div>
        </div>

        <!-- 시험 목록 -->
        <div class="card">
            <h2>📚 생성된 시험 목록</h2>
            <button class="btn btn-secondary" onclick="loadTests()">🔄 목록 새로고침</button>
            <ul id="testList" class="test-list"></ul>
        </div>
    </div>

    <script>
        // 페이지 로드 시 통계 및 목록 로드
        window.onload = function() {
            loadStats();
            loadTests();
        };

        function showStatus(elementId, message, type) {
            const el = document.getElementById(elementId);
            el.textContent = message;
            el.className = `status ${type}`;
            el.style.display = 'block';

            setTimeout(() => {
                el.style.display = 'none';
            }, 5000);
        }

        function showLoading(show) {
            document.getElementById('loading').style.display = show ? 'block' : 'none';
        }

        async function generateTest() {
            showLoading(true);

            try {
                const difficulty = document.getElementById('difficulty').value;

                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ difficulty })
                });

                const data = await response.json();

                if (data.success) {
                    showStatus('generateStatus',
                        `✓ 시험 생성 완료! ID: ${data.test_id}`,
                        'success');
                    loadTests();
                    loadStats();
                } else {
                    showStatus('generateStatus',
                        `✗ 생성 실패: ${data.error}`,
                        'error');
                }
            } catch (error) {
                showStatus('generateStatus',
                    `✗ 오류 발생: ${error.message}`,
                    'error');
            } finally {
                showLoading(false);
            }
        }

        async function generateWithValidation() {
            showLoading(true);

            try {
                const difficulty = document.getElementById('difficulty').value;

                const response = await fetch('/api/generate-validated', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ difficulty })
                });

                const data = await response.json();

                if (data.success) {
                    const report = data.validation_report;
                    const msg = `✓ 시험 생성 및 검증 완료!\\n` +
                                `ID: ${data.test_id}\\n` +
                                `검증: ${report.is_valid ? '합격' : '불합격'}\\n` +
                                `오류: ${report.errors.length}개, 경고: ${report.warnings.length}개`;
                    showStatus('generateStatus', msg, 'success');
                    loadTests();
                    loadStats();
                } else {
                    showStatus('generateStatus',
                        `✗ 생성 실패: ${data.error}`,
                        'error');
                }
            } catch (error) {
                showStatus('generateStatus',
                    `✗ 오류 발생: ${error.message}`,
                    'error');
            } finally {
                showLoading(false);
            }
        }

        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();

                document.getElementById('totalTests').textContent = data.total_tests;
                document.getElementById('totalQuestions').textContent = data.total_questions;
                document.getElementById('totalAttempts').textContent = data.total_attempts;
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        }

        async function loadTests() {
            try {
                const response = await fetch('/api/tests');
                const data = await response.json();

                const listEl = document.getElementById('testList');
                listEl.innerHTML = '';

                if (data.tests.length === 0) {
                    listEl.innerHTML = '<li style="text-align: center; color: #999; padding: 20px;">아직 생성된 시험이 없습니다.</li>';
                    return;
                }

                data.tests.forEach(test => {
                    const li = document.createElement('li');
                    li.className = 'test-item';
                    li.innerHTML = `
                        <div class="test-info">
                            <strong>${test.test_id}</strong><br>
                            <small>${test.question_count}문제 | ${new Date(test.created_at).toLocaleString('ko-KR')}</small>
                        </div>
                        <div class="test-actions">
                            <button class="btn btn-primary btn-small" onclick="downloadTest('${test.test_id}', 'html')">HTML</button>
                            <button class="btn btn-primary btn-small" onclick="downloadTest('${test.test_id}', 'json')">JSON</button>
                            <button class="btn btn-secondary btn-small" onclick="validateTest('${test.test_id}')">검증</button>
                        </div>
                    `;
                    listEl.appendChild(li);
                });
            } catch (error) {
                console.error('Failed to load tests:', error);
            }
        }

        async function downloadTest(testId, format) {
            window.location.href = `/api/download/${testId}?format=${format}`;
        }

        async function validateTest(testId) {
            try {
                const response = await fetch(`/api/validate/${testId}`);
                const data = await response.json();

                const report = data.report;
                alert(`검증 결과:\\n\\n` +
                      `상태: ${report.is_valid ? '✓ 합격' : '✗ 불합격'}\\n` +
                      `오류: ${report.errors.length}개\\n` +
                      `경고: ${report.warnings.length}개\\n\\n` +
                      (report.errors.length > 0 ? `첫 번째 오류: ${report.errors[0]}` : ''));
            } catch (error) {
                alert('검증 실패: ' + error.message);
            }
        }
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    """메인 페이지"""
    return render_template_string(INDEX_TEMPLATE)

@app.route('/api/generate', methods=['POST'])
def api_generate():
    """시험 생성 API"""
    try:
        data = request.json or {}
        difficulty = data.get('difficulty', 'medium')

        # 시험 생성
        questions = generator.generate_complete_test()

        # 저장
        test_id = f"TEST_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        db.save_test(test_id, questions, metadata={'difficulty': difficulty})

        # 파일로도 저장
        formatter.to_json(questions, f"tests/{test_id}.json")

        return jsonify({
            'success': True,
            'test_id': test_id,
            'question_count': len(questions)
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/generate-validated', methods=['POST'])
def api_generate_validated():
    """시험 생성 + 품질 검증 API"""
    try:
        data = request.json or {}
        difficulty = data.get('difficulty', 'medium')

        # 시험 생성
        questions = generator.generate_complete_test()

        # 품질 검증
        report = validator.validate_complete_test(questions)

        # 정답 분포가 불균형하면 자동 조정
        if not report['is_valid'] or any(
            r < 0.15 or r > 0.35
            for r in report['statistics']['answer_distribution'].values()
        ):
            questions = validator.auto_balance_answers(questions)
            report = validator.validate_complete_test(questions)

        # 저장
        test_id = f"TEST_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        db.save_test(test_id, questions, metadata={
            'difficulty': difficulty,
            'validated': True,
            'validation_report': report
        })

        # 파일로도 저장
        formatter.to_json(questions, f"tests/{test_id}.json")

        return jsonify({
            'success': True,
            'test_id': test_id,
            'question_count': len(questions),
            'validation_report': report
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/tests')
def api_tests():
    """테스트 목록 조회"""
    try:
        tests = db.list_tests(limit=20)
        return jsonify({'tests': tests})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats')
def api_stats():
    """통계 조회"""
    try:
        tests = db.list_tests(limit=1000)
        total_questions = sum(t['question_count'] for t in tests)

        # 응시 횟수는 실제 DB에서 가져와야 하지만 여기서는 0으로
        return jsonify({
            'total_tests': len(tests),
            'total_questions': total_questions,
            'total_attempts': 0
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/validate/<test_id>')
def api_validate(test_id):
    """테스트 검증"""
    try:
        questions = db.get_test(test_id)
        report = validator.validate_complete_test(questions)

        return jsonify({
            'test_id': test_id,
            'report': report
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/<test_id>')
def api_download(test_id):
    """테스트 다운로드"""
    try:
        format_type = request.args.get('format', 'json')
        questions = db.get_test(test_id)

        filepath = f"generated/{test_id}.{format_type}"

        if format_type == 'json':
            formatter.to_json(questions, filepath)
        elif format_type == 'html':
            formatter.to_html(questions, filepath, include_answers=False)
        elif format_type == 'markdown':
            formatter.to_markdown(questions, filepath, include_answers=True)
        else:
            return jsonify({'error': 'Invalid format'}), 400

        return send_file(filepath, as_attachment=True)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("TOPIK II 읽기 시험 생성기 웹 서버")
    print("=" * 60)
    print("서버 주소: http://localhost:5000")
    print("종료: Ctrl+C")
    print("=" * 60)

    app.run(debug=True, host='0.0.0.0', port=5000)
