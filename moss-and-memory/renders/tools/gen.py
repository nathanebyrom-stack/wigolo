"""Usage:
  gen.py krea OUT.png SEED W H "prompt"
  gen.py kontext OUT.png SEED IN.png "prompt" [guidance] [steps]
"""
import sys, shutil, time
from gradio_client import Client, handle_file
mode, out, seed = sys.argv[1], sys.argv[2], int(sys.argv[3])
for attempt in range(3):
    try:
        if mode == 'krea':
            w, h, prompt = int(sys.argv[4]), int(sys.argv[5]), sys.argv[6]
            c = Client('mcp-tools/FLUX.1-Krea-dev', verbose=False)
            res, s = c.predict(prompt, seed, False, w, h, 4.5, 28, api_name='/infer')
        else:
            inp, prompt = sys.argv[4], sys.argv[5]
            g = float(sys.argv[6]) if len(sys.argv) > 6 else 2.5
            st = int(sys.argv[7]) if len(sys.argv) > 7 else 28
            c = Client('mcp-tools/FLUX.1-Kontext-Dev', verbose=False)
            res, s = c.predict(handle_file(inp), prompt, seed, False, g, st, api_name='/infer')
        path = res['path'] if isinstance(res, dict) else res
        shutil.copy(path, out); print('OK', out, s); break
    except Exception as e:
        print('ERR', attempt, repr(e)[:400], file=sys.stderr); time.sleep(5)
else:
    sys.exit(1)
