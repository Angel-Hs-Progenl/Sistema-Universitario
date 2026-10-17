
import { useState } from "react";

import {
  MessageSquare,
  Search,
  ShieldCheck,
  LockKeyhole,
  MessageCircle,
  Lightbulb
} from "lucide-react";

import {
  GRUPOS,
  GRUPOS_PUBLICABLES,
  COMENTARIOS_PUBLICABLES,
  REPORTE_AUTORIZADO_DEMO,
  MIN_RESPUESTAS,
  PERIODO_ACTUAL
} from "../../data/docenteMock";

import "./ComentariosDocente.css";

export default function ComentariosDocente() {
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [grupo, setGrupo] = useState("todos");

  // Datos compartidos desde docenteMock.js
  const gruposPermitidos = GRUPOS_PUBLICABLES;
  const comentariosPermitidos = COMENTARIOS_PUBLICABLES;

  // Filtrar por texto, tipo y grupo
  const filtrados = comentariosPermitidos.filter((comentario) => {
    const coincideTexto = comentario.texto
      .toLowerCase()
      .includes(busqueda.trim().toLowerCase());

    const coincideTipo =
      tipo === "todos" || comentario.tipo === tipo;

    const coincideGrupo =
      grupo === "todos" ||
      comentario.grupoId === Number(grupo);

    return coincideTexto && coincideTipo && coincideGrupo;
  });

  // Contar comentarios por tipo
  const fortalezas = comentariosPermitidos.filter(
    (comentario) => comentario.tipo === "fortaleza"
  ).length;

  const sugerencias = comentariosPermitidos.filter(
    (comentario) => comentario.tipo === "sugerencia"
  ).length;

  // Obtener nombre del grupo
  const nombreGrupo = (id) =>
    GRUPOS.find((g) => g.id === id)?.nombre ?? "Grupo";

  return (
    <div className="cd-page">

      {/* ENCABEZADO */}
      <div className="cd-heading">
        <div>
          <h1>Comentarios recibidos</h1>

          <p>
            Conoce las opiniones anónimas de tus estudiantes
            e identifica oportunidades de mejora.
          </p>
        </div>

        <span className="cd-periodo">
          {PERIODO_ACTUAL}
        </span>
      </div>

      {/* AVISO DE DEMOSTRACIÓN */}
      <p className="cd-demo">
        Vista de demostración con comentarios simulados.
        Los comentarios reales estarán disponibles
        cuando Dirección Académica autorice su publicación.
      </p>

      {!REPORTE_AUTORIZADO_DEMO ? (

        /* COMENTARIOS NO AUTORIZADOS */
        <section className="cd-locked">
          <LockKeyhole size={38} />

          <h2>Comentarios aún no disponibles</h2>

          <p>
            Los comentarios se mostrarán cuando
            Dirección Académica autorice la publicación
            del reporte final.
          </p>
        </section>

      ) : (

        <>
          {/* TARJETAS DE RESUMEN */}
          <section className="cd-stats">

            <article className="cd-stat">
              <div className="cd-stat-top">
                <span>Total de comentarios</span>
                <MessageSquare size={21} />
              </div>

              <strong>
                {comentariosPermitidos.length}
              </strong>

              <small>Opiniones disponibles</small>
            </article>

            <article className="cd-stat">
              <div className="cd-stat-top">
                <span>Fortalezas</span>
                <MessageCircle size={21} />
              </div>

              <strong>{fortalezas}</strong>

              <small>Comentarios positivos</small>
            </article>

            <article className="cd-stat">
              <div className="cd-stat-top">
                <span>Sugerencias</span>
                <Lightbulb size={21} />
              </div>

              <strong>{sugerencias}</strong>

              <small>Oportunidades de mejora</small>
            </article>

          </section>

          {/* AVISO DE PRIVACIDAD */}
          <div className="cd-privacy">
            <ShieldCheck size={22} />

            <p>
              Los comentarios de esta demostración
              no incluyen datos personales.
              Solo se muestran comentarios de grupos
              con al menos {MIN_RESPUESTAS} respuestas.
            </p>
          </div>

          {/* OPINIONES DE LOS ESTUDIANTES */}
          <section className="cd-panel">

            <div className="cd-panel-heading">
              <div>
                <h2>Opiniones de los estudiantes</h2>

                <p>
                  Filtra los comentarios por tipo o grupo.
                </p>
              </div>
            </div>

            {/* FILTROS */}
            <div className="cd-filters">

              <label className="cd-search">
                <Search size={18} />

                <input
                  type="search"
                  placeholder="Buscar comentario..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </label>

              <select
                aria-label="Filtrar tipo de comentario"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="todos">
                  Todos los tipos
                </option>

                <option value="fortaleza">
                  Fortalezas
                </option>

                <option value="sugerencia">
                  Sugerencias
                </option>
              </select>

              <select
                aria-label="Filtrar por grupo"
                value={grupo}
                onChange={(e) => setGrupo(e.target.value)}
              >
                <option value="todos">
                  Todos los grupos
                </option>

                {gruposPermitidos.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}
                  </option>
                ))}
              </select>

            </div>

            {/* LISTA DE COMENTARIOS */}
            <div className="cd-comments">

              {filtrados.length === 0 ? (

                <p className="cd-empty">
                  No se encontraron comentarios
                  con estos filtros.
                </p>

              ) : (

                filtrados.map((comentario) => (

                  <article
                    key={comentario.id}
                    className="cd-comment"
                  >

                    <div className="cd-comment-header">

                      <span
                        className={
                          comentario.tipo === "fortaleza"
                            ? "cd-tag fortaleza"
                            : "cd-tag sugerencia"
                        }
                      >
                        {comentario.tipo === "fortaleza"
                          ? "Fortaleza"
                          : "Sugerencia"}
                      </span>

                      <span className="cd-anonymous">
                        <ShieldCheck size={15} />
                        Anónimo
                      </span>

                    </div>

                    <p className="cd-comment-text">
                      “{comentario.texto}”
                    </p>

                    <span className="cd-comment-group">
                      {nombreGrupo(comentario.grupoId)}
                    </span>

                  </article>

                ))

              )}

            </div>

            {/* CONTADOR */}
            <div className="cd-footer">
              Mostrando {filtrados.length} de{" "}
              {comentariosPermitidos.length} comentarios
            </div>

          </section>
        </>

      )}

    </div>
  );
}
