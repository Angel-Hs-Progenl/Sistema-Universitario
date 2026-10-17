import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { DOCUMENTS,STATES,TRANSITIONS,canReview } from '../shared/titulacion.js';
test('El cliente utiliza el mismo catálogo y flujo que el servidor',()=>{
  const executable=process.env.PYTHON||'python';
  const result=execFileSync(executable,['-c',"import sys,json;sys.path.insert(0,'backend');from app.modules.titulacion.domain import DOCUMENTS,STATES,TRANSITIONS;print(json.dumps([DOCUMENTS,STATES,TRANSITIONS]))"],{encoding:'utf8'});
  assert.deepEqual(JSON.parse(result),[DOCUMENTS,STATES,TRANSITIONS]);
});
test('Tesorería es la única área que valida pagos',()=>{
  assert.equal(canReview('tesoreria','pago'),true);
  for(const role of ['administrador','escolares','vinculacion','estudiante'])assert.equal(canReview(role,'pago'),false);
});
test('El cliente de becas utiliza el mismo catálogo que el servidor',async ()=>{
  const { MODALIDADES, ESTADOS_BECA, DOCUMENTOS_BECA } = await import('../shared/becas.js');
  const executable=process.env.PYTHON||'python';
  const result=execFileSync(executable,['-c',"import sys,json;sys.path.insert(0,'backend');from app.modules.becas.domain import MODALIDADES,ESTADOS,DOCUMENTOS;print(json.dumps([MODALIDADES,ESTADOS,DOCUMENTOS]))"],{encoding:'utf8'});
  assert.deepEqual(JSON.parse(result),[MODALIDADES,ESTADOS_BECA,DOCUMENTOS_BECA]);
});
