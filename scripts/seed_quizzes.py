import argparse
import csv
import getpass
import json
import pathlib
import sys
import urllib.error
import urllib.request
from typing import Any

KNOWN_IMAGES = {
    'Q284': 'Q284.jpg',
    'Q293': 'Q293.png',
    'Q324': 'Q324.png',
    'Q246': 'Q246.png',
    'Q247': 'Q247.png',
    'MTQ-026': 'MTQ-026.jpeg',
    'MTQ-042': 'MTQ-042.jpg',
    'MTQ-043': 'MTQ-043.jpg',
    'MTQ-044': 'MTQ-044.jpeg',
    'MTQ-053': 'MTQ-053.png',
}


class ApiClient:
    def __init__(self, base_url: str, token: str, refresh_token: str | None = None):
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.refresh_token = refresh_token

    def _refresh(self) -> None:
        if not self.refresh_token:
            raise RuntimeError('Access token expired and no refresh token provided')

        url = f'{self.base_url}/auth/refresh'
        data = json.dumps({'refreshToken': self.refresh_token}).encode('utf-8')
        request = urllib.request.Request(
            url,
            data=data,
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; TaxiAppSeeder/1.0)',
            },
            method='POST',
        )
        try:
            with urllib.request.urlopen(request) as response:
                raw = response.read().decode('utf-8').strip()
                result = json.loads(raw) if raw.startswith('{') else raw
        except urllib.error.HTTPError as exc:
            error_body = exc.read().decode('utf-8')
            raise RuntimeError(f'POST {url} failed {exc.code}: {error_body}') from exc

        self.token = result['accessToken']
        if result.get('refreshToken'):
            self.refresh_token = result['refreshToken']
        print('Access token refreshed', file=sys.stderr)

    def _request(
        self,
        method: str,
        path: str,
        payload: dict | None = None,
        allow_refresh: bool = True,
    ) -> Any:
        url = f'{self.base_url}{path}'
        if payload is not None:
            payload = {k: v for k, v in payload.items() if v is not None}
        data = json.dumps(payload).encode('utf-8') if payload else None
        request = urllib.request.Request(
            url,
            data=data,
            headers={
                'Authorization': f'Bearer {self.token}',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; TaxiAppSeeder/1.0)',
            },
            method=method,
        )
        try:
            with urllib.request.urlopen(request) as response:
                raw = response.read().decode('utf-8').strip()
                if not raw:
                    return None
                if raw.startswith('{') or raw.startswith('['):
                    return json.loads(raw)
                return raw
        except urllib.error.HTTPError as exc:
            if exc.code == 401 and allow_refresh and self.refresh_token:
                self._refresh()
                return self._request(method, path, payload, allow_refresh=False)

            error_body = exc.read().decode('utf-8')
            print(f'[DEBUG] {method} {url} payload: {payload}', file=sys.stderr)
            raise RuntimeError(f'{method} {url} failed {exc.code}: {error_body}') from exc

    def create_problem(self, problem: dict) -> str:
        return self._request('POST', '/problems', problem)

    def create_problem_set(self, label: str, problems: list[str]) -> str:
        return self._request('POST', '/problem-sets', {'label': label, 'problems': problems})

    def list_problem_sets(self) -> list[dict]:
        return self._request('GET', '/problem-sets') or []

    def list_problems(self) -> list[dict]:
        return self._request('GET', '/problems') or []

    def delete_problem_set(self, problem_set_id: str) -> None:
        self._request('DELETE', f'/problem-sets/{problem_set_id}')

    def delete_problem(self, problem_id: str) -> None:
        self._request('DELETE', f'/problems/{problem_id}')


def load_json(name: str) -> Any:
    root = pathlib.Path(__file__).resolve().parent.parent
    path = root / 'src' / 'data' / 'json' / name
    return json.loads(path.read_text(encoding='utf-8'))


def _correct_index(options: list[dict], correct_key: str) -> int:
    if options and 'is_correct' in options[0]:
        for index, option in enumerate(options):
            if option.get('is_correct'):
                return index
    for index, option in enumerate(options):
        if option.get('key') == correct_key:
            return index
    raise ValueError(f'Correct option {correct_key} not found in options')


def _build_vocab_pages(config: dict, dry_run: bool) -> list[dict]:
    if not config.get('vocab', {}).get('enabled'):
        return []

    data = load_json('vocab.json')
    template = config['vocab']['page_template']
    pages = []

    for set_meta in data['sets']:
        set_id = set_meta['id']
        questions = [
            q for q in data['questions'] if q['set_id'] == set_id
        ]
        questions.sort(key=lambda q: q['index'])

        problems = []
        for q in questions:
            problems.append({
                'text': q['prompt_word_fi'],
                'options': [opt['en'] for opt in q['options']],
                'correctAnswer': _correct_index(q['options'], q['correct_option']),
                'explanation': q.get('correct_meaning_en') or None,
                'imageKey': None,
            })

        pages.append({
            'page': template.format(set_id=set_id),
            'local_id': set_id,
            'label': f"Vocab Set {set_meta['set_no']}: {set_meta['name']}",
            'problems': problems,
        })

    return pages


def _build_clue_pages(config: dict, dry_run: bool) -> list[dict]:
    if not config.get('clue', {}).get('enabled'):
        return []

    data = load_json('clue.json')
    template = config['clue']['page_template']
    pages = []

    for group in data['groups']:
        group_id = group['id']
        questions = [
            q for q in data['questions'] if q['group_id'] == group_id
        ]
        questions.sort(key=lambda q: q['index'])

        problems = []
        for q in questions:
            problems.append({
                'text': q['prompt'],
                'options': [opt['text'] for opt in q['options']],
                'correctAnswer': _correct_index(q['options'], q['correct_option']),
                'explanation': q.get('correct_answer') or None,
                'imageKey': None,
            })

        pages.append({
            'page': template.format(group_id=group_id),
            'local_id': group_id,
            'label': f"Clue Words: {group['label']}",
            'problems': problems,
        })

    return pages


def _build_model_test_pages(config: dict, dry_run: bool) -> list[dict]:
    if not config.get('model_tests', {}).get('enabled'):
        return []

    tests = load_json('model_tests.json')
    question_map = {
        q['id']: q
        for q in load_json('model_test_questions.json') + load_json('questions.json')
    }
    template = config['model_tests']['page_template']
    pages = []

    for test in tests:
        test_id = test['id']
        problems = []
        for qid in test['question_ids']:
            q = question_map[qid]
            problems.append({
                'text': q['question']['fi'],
                'options': [opt['fi'] for opt in q['options']],
                'correctAnswer': _correct_index(q['options'], q['correct_option']),
                'explanation': None,
                'imageKey': KNOWN_IMAGES.get(q['id']),
            })

        pages.append({
            'page': template.format(test_id=test_id),
            'local_id': test_id,
            'label': test['title_en'],
            'problems': problems,
        })

    return pages


def _build_topic_lesson_pages(config: dict, dry_run: bool) -> list[dict]:
    if not config.get('topic_lessons', {}).get('enabled'):
        return []

    topic_data = load_json('topic_practice.json')
    question_map = {q['id']: q for q in load_json('questions.json')}
    template = config['topic_lessons']['page_template']
    section_map = {s['id']: s for s in topic_data['sections']}
    pages = []

    for lesson in topic_data['lessons']:
        section = section_map[lesson['section_id']]
        problems = []
        for qid in lesson['question_ids']:
            q = question_map[qid]
            problems.append({
                'text': q['question']['fi'],
                'options': [opt['fi'] for opt in q['options']],
                'correctAnswer': _correct_index(q['options'], q['correct_option']),
                'explanation': None,
                'imageKey': KNOWN_IMAGES.get(q['id']),
            })

        pages.append({
            'page': template.format(section_id=lesson['section_id'], lesson_id=lesson['id']),
            'local_id': lesson['id'],
            'label': f"{section['name_en']} - {lesson['name']}",
            'problems': problems,
        })

    return pages


def build_pages(config: dict, dry_run: bool) -> list[dict]:
    pages: list[dict] = []
    pages.extend(_build_vocab_pages(config, dry_run))
    pages.extend(_build_clue_pages(config, dry_run))
    pages.extend(_build_model_test_pages(config, dry_run))
    pages.extend(_build_topic_lesson_pages(config, dry_run))
    return pages


def cleanup(client: ApiClient, dry_run: bool) -> None:
    if dry_run:
        return

    problem_sets = client.list_problem_sets()
    for problem_set in problem_sets:
        client.delete_problem_set(problem_set['_id'])
        print(f"Deleted problem set {problem_set['_id']}")

    problems = client.list_problems()
    for problem in problems:
        client.delete_problem(problem['_id'])
        print(f"Deleted problem {problem['_id']}")


def _load_state(state_path: pathlib.Path) -> dict:
    if state_path.exists():
        return json.loads(state_path.read_text(encoding='utf-8'))
    return {'completed_pages': [], 'partial_page': None}


def _save_state(state_path: pathlib.Path, state: dict) -> None:
    state_path.write_text(json.dumps(state, indent=2), encoding='utf-8')


def _prepare_pages_for_resume(
    pages: list[dict],
    state: dict,
    client: ApiClient,
    dry_run: bool,
) -> list[dict]:
    completed_local_ids = {page['local_id'] for page in state['completed_pages']}
    pending_pages = [page for page in pages if page['local_id'] not in completed_local_ids]

    partial = state.get('partial_page')
    if partial:
        if not dry_run:
            for problem_id in partial['problem_ids']:
                try:
                    client.delete_problem(problem_id)
                    print(f"Deleted orphan problem {problem_id}")
                except RuntimeError as exc:
                    print(f"Warning: could not delete orphan {problem_id}: {exc}")
        state['partial_page'] = None

        if partial['local_id'] not in completed_local_ids:
            matching = [page for page in pending_pages if page['local_id'] == partial['local_id']]
            if not matching:
                pending_pages.insert(0, partial)

    return pending_pages


def seed_and_write_csv(
    config: dict,
    token: str,
    refresh_token: str | None,
    output_path: pathlib.Path,
    state_path: pathlib.Path,
    dry_run: bool,
    skip_cleanup: bool,
    resume: bool,
) -> None:
    client = ApiClient(config.get('base_url', 'https://api.taxipilot.fi'), token, refresh_token)

    if resume:
        state = _load_state(state_path)
    else:
        state = {'completed_pages': [], 'partial_page': None}
        if state_path.exists():
            state_path.unlink()

    if not skip_cleanup and not resume:
        cleanup(client, dry_run)

    pages = build_pages(config, dry_run)
    pages = _prepare_pages_for_resume(pages, state, client, dry_run)

    for page in pages:
        state['partial_page'] = {
            'page': page['page'],
            'local_id': page['local_id'],
            'label': page['label'],
            'problem_ids': [],
        }

        if dry_run:
            problem_ids = [f'dry-run-problem-{i}' for i in range(len(page['problems']))]
            problem_set_id = f'dry-run-{page["local_id"]}'
        else:
            problem_ids = []
            for problem in page['problems']:
                problem_id = client.create_problem(problem)
                problem_ids.append(problem_id)
                state['partial_page']['problem_ids'].append(problem_id)
                _save_state(state_path, state)

            problem_set_id = client.create_problem_set(page['label'], problem_ids)

        state['completed_pages'].append({
            'page': page['page'],
            'local_id': page['local_id'],
            'label': page['label'],
            'problem_set_id': problem_set_id,
            'problem_count': len(problem_ids),
        })
        state['partial_page'] = None
        _save_state(state_path, state)

        print(f"Seeded {page['page']} -> {problem_set_id} ({len(problem_ids)} problems)")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(
            f,
            fieldnames=['page', 'local_id', 'label', 'problem_set_id', 'problem_count'],
        )
        writer.writeheader()
        writer.writerows(state['completed_pages'])

    if state_path.exists():
        state_path.unlink()

    print(f"Wrote {len(state['completed_pages'])} rows to {output_path}")


def main() -> int:
    parser = argparse.ArgumentParser(description='Seed quizzes from JSON to the backend API.')
    parser.add_argument('--config', default='scripts/seed_quizzes_config.json', help='Path to config JSON')
    parser.add_argument('--token', help='Admin access token (if omitted, you will be prompted)')
    parser.add_argument('--refresh-token', help='Refresh token for automatic token refresh on expiry')
    parser.add_argument('--output', default='quiz_problem_sets.csv', help='Output CSV path')
    parser.add_argument('--state-file', default='seed_state.json', help='Progress state file for resume')
    parser.add_argument('--dry-run', action='store_true', help='Build CSV without calling API')
    parser.add_argument('--skip-cleanup', action='store_true', help='Skip deleting existing problems and problem sets')
    parser.add_argument('--resume', action='store_true', help='Resume from existing state file')
    args = parser.parse_args()

    config_path = pathlib.Path(args.config)
    config = json.loads(config_path.read_text(encoding='utf-8'))

    token = args.token
    if not token:
        token = getpass.getpass('Admin access token: ')

    output_path = pathlib.Path(args.output)
    state_path = pathlib.Path(args.state_file)

    seed_and_write_csv(
        config,
        token,
        args.refresh_token,
        output_path,
        state_path,
        args.dry_run,
        args.skip_cleanup,
        args.resume,
    )
    return 0


if __name__ == '__main__':
    sys.exit(main())
